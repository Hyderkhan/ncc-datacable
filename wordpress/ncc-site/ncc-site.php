<?php
/**
 * Plugin Name:       NCC Site and Quote Form
 * Description:       Serves the Next Century Communications one-page site as the homepage and emails every quote request to the business inbox.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Next Century Communications
 * License:           GPL-2.0-or-later
 * Text Domain:       ncc-site
 *
 * How it works
 * - On the front page the plugin outputs site/template.html (the static site)
 *   instead of the theme, pointing its stylesheet, scripts and images at this
 *   plugin's folder.
 * - The quote form posts JSON to /wp-json/ncc/v1/quote. The plugin validates
 *   it, emails the request to the recipient set under Settings, NCC Site
 *   (info@nextcc.com.au by default) with Reply-To set to the customer, and
 *   emails the customer a confirmation with a reference number.
 * - Mail goes through wp_mail(), so an SMTP plugin (for example WP Mail SMTP
 *   with Google Workspace) improves delivery without any change here.
 */

defined( 'ABSPATH' ) || exit;

final class NCC_Site {

	const OPTION        = 'ncc_site_settings';
	const DEFAULT_TO    = 'info@nextcc.com.au';
	const BUSINESS_NAME = 'Next Century Communications';
	const PHONE         = '0415 669 617';

	public static function init() {
		add_action( 'template_redirect', array( __CLASS__, 'serve_front_page' ), 0 );
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
		add_action( 'admin_menu', array( __CLASS__, 'admin_menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_post_ncc_site_test_email', array( __CLASS__, 'send_test_email' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( __CLASS__, 'action_links' ) );
	}

	/** Saved settings merged over the defaults. */
	public static function settings() {
		$saved = get_option( self::OPTION, array() );
		return wp_parse_args(
			is_array( $saved ) ? $saved : array(),
			array(
				'recipient'        => self::DEFAULT_TO,
				'confirm_customer' => 1,
				'takeover_home'    => 1,
			)
		);
	}

	/* ------------------------------------------------------------------ *
	 * Front page
	 * ------------------------------------------------------------------ */

	public static function serve_front_page() {
		$s = self::settings();
		if ( empty( $s['takeover_home'] ) || ! is_front_page() || is_feed() || is_preview() || is_customize_preview() ) {
			return;
		}
		$method = isset( $_SERVER['REQUEST_METHOD'] ) ? strtoupper( sanitize_key( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) ) : 'GET';
		if ( 'GET' !== $method && 'HEAD' !== $method ) {
			return;
		}
		$file = plugin_dir_path( __FILE__ ) . 'site/template.html';
		if ( ! is_readable( $file ) ) {
			return;
		}

		status_header( 200 );
		header( 'Content-Type: text/html; charset=utf-8' );
		// The template is a static file shipped inside this plugin, not user input.
		echo self::prepare_html( (string) file_get_contents( $file ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		exit;
	}

	/** Point the template's relative URLs at this plugin and wire in the form endpoint. */
	private static function prepare_html( $html ) {
		$dir  = plugin_dir_path( __FILE__ ) . 'site/';
		$base = plugin_dir_url( __FILE__ ) . 'site/';
		$home = home_url( '/' );

		// assets/…, styles.css, main.js, config.js → plugin URL. css/js get the file's
		// modified time as their version, replacing any ?v= the static copy carries.
		$html = preg_replace_callback(
			'/\b(src|href)="(?!https?:|\/\/|\/|#|mailto:|tel:|data:)([^"]+)"/i',
			function ( $m ) use ( $dir, $base ) {
				$path = strtok( $m[2], '?' );
				$url  = $base . $m[2];
				if ( preg_match( '/\.(css|js)$/i', $path ) && is_readable( $dir . $path ) ) {
					$url = add_query_arg( 'ver', (string) filemtime( $dir . $path ), $base . $path );
				}
				return $m[1] . '="' . esc_url( $url ) . '"';
			},
			$html
		);

		// Absolute URLs written for the static mockup → this WordPress site.
		$html = str_replace(
			array(
				'https://hyderkhan.github.io/ncc-datacable/assets/',
				'https://nccdatacable.com/assets/',
				'https://hyderkhan.github.io/ncc-datacable/',
				'https://nccdatacable.com/',
			),
			array( $base . 'assets/', $base . 'assets/', $home, $home ),
			$html
		);

		// Tell main.js where to send the quote form.
		$inline = '<script>window.NCC_CONFIG=window.NCC_CONFIG||{};window.NCC_CONFIG.endpoint='
			. wp_json_encode( esc_url_raw( rest_url( 'ncc/v1/quote' ) ), JSON_UNESCAPED_SLASHES )
			. ';</script>';
		$html = preg_replace_callback(
			'#<script src="[^"]*config\.js[^"]*"></script>#', // matches with or without a ?ver= query

			function ( $m ) use ( $inline ) {
				return $m[0] . "\n" . $inline;
			},
			$html,
			1
		);

		return $html;
	}

	/* ------------------------------------------------------------------ *
	 * Quote form endpoint
	 * ------------------------------------------------------------------ */

	public static function register_routes() {
		register_rest_route(
			'ncc/v1',
			'/quote',
			array(
				'methods'             => 'POST',
				'callback'            => array( __CLASS__, 'handle_quote' ),
				'permission_callback' => '__return_true', // Public form: anyone may ask for a quote.
			)
		);
	}

	public static function handle_quote( WP_REST_Request $req ) {
		$p = $req->get_json_params();
		if ( ! is_array( $p ) ) {
			$p = $req->get_body_params();
		}
		if ( ! is_array( $p ) ) {
			$p = array();
		}

		// Honeypot: people never see this field. Report success so bots move on, send nothing.
		if ( '' !== self::text( $p, 'company_website', 200 ) ) {
			return new WP_REST_Response( array( 'ok' => true, 'ref' => self::make_ref(), 'customerSent' => false ), 200 );
		}

		if ( self::rate_limited() ) {
			return self::error( 'Too many requests from this connection. Please call us on ' . self::PHONE . '.', 429 );
		}

		$property = self::text( $p, 'property_type', 20 );
		$f        = array(
			'from_name'      => self::text( $p, 'from_name', 80 ),
			'phone'          => self::text( $p, 'phone', 30 ),
			'reply_to'       => sanitize_email( self::text( $p, 'reply_to', 120 ) ),
			'suburb'         => self::text( $p, 'suburb', 80 ),
			'property_type'  => in_array( $property, array( 'Residential', 'Commercial' ), true ) ? $property : 'Residential',
			'service'        => self::text( $p, 'service', 120 ),
			'nbn_type'       => self::text( $p, 'nbn_type', 40 ),
			'preferred_date' => self::text( $p, 'preferred_date', 40 ),
			'preferred_time' => self::text( $p, 'preferred_time', 40 ),
			'message'        => self::textarea( $p, 'message', 3000 ),
		);

		$missing = array();
		if ( mb_strlen( $f['from_name'] ) < 2 ) {
			$missing[] = 'your name';
		}
		if ( strlen( preg_replace( '/\D/', '', $f['phone'] ) ) < 8 ) {
			$missing[] = 'a phone number';
		}
		if ( ! is_email( $f['reply_to'] ) ) {
			$missing[] = 'a valid email';
		}
		if ( mb_strlen( $f['suburb'] ) < 3 ) {
			$missing[] = 'the suburb';
		}
		if ( '' === $f['service'] ) {
			$missing[] = 'the service';
		}
		if ( $missing ) {
			return self::error( 'Please add ' . implode( ', ', $missing ) . '.', 400 );
		}

		$s   = self::settings();
		$ref = self::make_ref();
		$v   = array_merge(
			$f,
			array(
				'ref'            => $ref,
				'received'       => wp_date( 'j M Y, g:i a' ),
				'nbn_type'       => '' !== $f['nbn_type'] ? $f['nbn_type'] : 'Not sure',
				'preferred_date' => '' !== $f['preferred_date'] ? $f['preferred_date'] : 'Any date',
				'preferred_time' => '' !== $f['preferred_time'] ? $f['preferred_time'] : 'Any time',
				'message'        => '' !== $f['message'] ? $f['message'] : 'No extra details given.',
			)
		);

		$from_name = function () {
			return self::BUSINESS_NAME;
		};
		add_filter( 'wp_mail_from_name', $from_name );

		$owner_sent = wp_mail(
			$s['recipient'],
			sprintf( 'New quote request %s: %s in %s', $ref, $v['service'], $v['suburb'] ),
			self::owner_body( $v ),
			array( 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . self::address( $v['from_name'], $v['reply_to'] ) )
		);

		$customer_sent = false;
		if ( $owner_sent && ! empty( $s['confirm_customer'] ) ) {
			$customer_sent = wp_mail(
				$v['reply_to'],
				sprintf( "We've received your quote request (%s)", $ref ),
				self::customer_body( $v ),
				array( 'Content-Type: text/plain; charset=UTF-8', 'Reply-To: ' . self::address( self::BUSINESS_NAME, $s['recipient'] ) )
			);
		}

		remove_filter( 'wp_mail_from_name', $from_name );

		if ( ! $owner_sent ) {
			return self::error( "Your request couldn't be sent just now. Please call us on " . self::PHONE . '.', 500 );
		}

		return new WP_REST_Response(
			array(
				'ok'           => true,
				'ref'          => $ref,
				'customerSent' => (bool) $customer_sent,
			),
			200
		);
	}

	private static function owner_body( $v ) {
		return "New quote request from the website\n\n"
			. "Reference: {$v['ref']}\n"
			. "Received: {$v['received']}\n\n"
			. "Customer\n"
			. "Name: {$v['from_name']}\n"
			. "Phone: {$v['phone']}\n"
			. "Email: {$v['reply_to']}\n\n"
			. "Job\n"
			. "Service: {$v['service']}\n"
			. "Property: {$v['property_type']}\n"
			. "Location: {$v['suburb']}\n"
			. "NBN connection: {$v['nbn_type']}\n"
			. "Preferred: {$v['preferred_date']}, {$v['preferred_time']}\n\n"
			. "Details\n{$v['message']}\n\n"
			. "Reply to this email or call the customer back with a price and to confirm a time.\n";
	}

	private static function customer_body( $v ) {
		$biz   = self::BUSINESS_NAME;
		$phone = self::PHONE;
		$email = self::settings()['recipient'];
		return "Hi {$v['from_name']},\n\n"
			. "Thanks for contacting {$biz}. We've received your quote request and will call you soon.\n\n"
			. "Your reference: {$v['ref']}\n\n"
			. "What you asked for\n"
			. "Service: {$v['service']}\n"
			. "Location: {$v['suburb']}\n"
			. "Preferred: {$v['preferred_date']}, {$v['preferred_time']}\n\n"
			. "What happens next\n"
			. "We'll call you on {$v['phone']} to talk through the job, give you a price and confirm a time, usually the same day. If it's urgent, call us on {$phone}.\n\n"
			. "{$biz}\n"
			. "Licensed data cabler and NBN technician, Sydney's Eastern Suburbs\n"
			. "{$phone}\n"
			. "{$email}\n";
	}

	/** One-line text field: tags, line breaks and extra spaces removed, length capped. */
	private static function text( $p, $key, $max ) {
		$raw = isset( $p[ $key ] ) && is_scalar( $p[ $key ] ) ? (string) $p[ $key ] : '';
		return mb_substr( sanitize_text_field( $raw ), 0, $max );
	}

	/** Multi-line text field: tags removed, line breaks kept, length capped. */
	private static function textarea( $p, $key, $max ) {
		$raw = isset( $p[ $key ] ) && is_scalar( $p[ $key ] ) ? (string) $p[ $key ] : '';
		return mb_substr( sanitize_textarea_field( $raw ), 0, $max );
	}

	/** "Name <email>" for a header, with characters that could split or inject headers removed. */
	private static function address( $name, $email ) {
		$name = trim( str_replace( array( '"', '<', '>', ',', ';', "\r", "\n" ), '', $name ) );
		return ( '' !== $name ? $name . ' ' : '' ) . '<' . sanitize_email( $email ) . '>';
	}

	private static function make_ref() {
		return 'NCC-' . strtoupper( wp_generate_password( 6, false, false ) );
	}

	private static function error( $message, $status ) {
		return new WP_REST_Response( array( 'ok' => false, 'message' => $message ), $status );
	}

	/** A few requests per connection per ten minutes; generous for people, a wall for scripts. */
	private static function rate_limited() {
		$limit  = (int) apply_filters( 'ncc_site_rate_limit', 8 );
		$window = (int) apply_filters( 'ncc_site_rate_window', 10 * MINUTE_IN_SECONDS );
		$ip     = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : 'unknown';
		$key    = 'ncc_site_rl_' . md5( $ip );
		$count  = (int) get_transient( $key );
		if ( $count >= $limit ) {
			return true;
		}
		set_transient( $key, $count + 1, $window );
		return false;
	}

	/* ------------------------------------------------------------------ *
	 * Settings, NCC Site
	 * ------------------------------------------------------------------ */

	public static function admin_menu() {
		add_options_page( 'NCC Site', 'NCC Site', 'manage_options', 'ncc-site', array( __CLASS__, 'render_settings' ) );
	}

	public static function register_settings() {
		register_setting(
			'ncc_site',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_settings' ),
				'default'           => array(),
			)
		);
	}

	public static function sanitize_settings( $in ) {
		$in    = is_array( $in ) ? $in : array();
		$email = isset( $in['recipient'] ) ? sanitize_email( $in['recipient'] ) : '';
		if ( ! is_email( $email ) ) {
			add_settings_error( self::OPTION, 'recipient', 'That email address is not valid, so quote requests still go to ' . self::DEFAULT_TO . '.' );
			$email = self::DEFAULT_TO;
		}
		return array(
			'recipient'        => $email,
			'confirm_customer' => empty( $in['confirm_customer'] ) ? 0 : 1,
			'takeover_home'    => empty( $in['takeover_home'] ) ? 0 : 1,
		);
	}

	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=ncc-site' ) ) . '">Settings</a>' );
		return $links;
	}

	public static function render_settings() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$s    = self::settings();
		$test = isset( $_GET['ncc_test'] ) ? sanitize_key( wp_unslash( $_GET['ncc_test'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		?>
		<div class="wrap">
			<h1>NCC Site</h1>
			<?php if ( 'sent' === $test ) : ?>
				<div class="notice notice-success"><p>Test email handed to WordPress for delivery to <?php echo esc_html( $s['recipient'] ); ?>. Check that inbox, including spam.</p></div>
			<?php elseif ( 'failed' === $test ) : ?>
				<div class="notice notice-error"><p>WordPress could not send the test email. Install an SMTP plugin (for example WP Mail SMTP) and connect the business mailbox, then try again.</p></div>
			<?php endif; ?>

			<form method="post" action="options.php">
				<?php settings_fields( 'ncc_site' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="ncc-recipient">Send quote requests to</label></th>
						<td>
							<input id="ncc-recipient" class="regular-text" type="email" name="<?php echo esc_attr( self::OPTION ); ?>[recipient]" value="<?php echo esc_attr( $s['recipient'] ); ?>" required>
							<p class="description">Every request from the website form is emailed here, with Reply-To set to the customer.</p>
						</td>
					</tr>
					<tr>
						<th scope="row">Customer confirmation</th>
						<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[confirm_customer]" value="1" <?php checked( ! empty( $s['confirm_customer'] ) ); ?>> Email the customer a copy with their reference number</label></td>
					</tr>
					<tr>
						<th scope="row">Homepage</th>
						<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[takeover_home]" value="1" <?php checked( ! empty( $s['takeover_home'] ) ); ?>> Show the NCC one-page site as the homepage</label></td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<h2>Check email delivery</h2>
			<p>Sends a test message to <?php echo esc_html( $s['recipient'] ); ?> through the same route the form uses.</p>
			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="ncc_site_test_email">
				<?php wp_nonce_field( 'ncc_site_test_email' ); ?>
				<?php submit_button( 'Send test email', 'secondary', 'submit', false ); ?>
			</form>
		</div>
		<?php
	}

	public static function send_test_email() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( 'You do not have permission to do that.' );
		}
		check_admin_referer( 'ncc_site_test_email' );
		$s  = self::settings();
		$ok = wp_mail(
			$s['recipient'],
			'Test from your website quote form',
			"This is a test from the quote form on " . home_url( '/' ) . ".\n\nIf you're reading this, quote requests from the website will reach this inbox.\n",
			array( 'Content-Type: text/plain; charset=UTF-8' )
		);
		wp_safe_redirect( add_query_arg( 'ncc_test', $ok ? 'sent' : 'failed', admin_url( 'options-general.php?page=ncc-site' ) ) );
		exit;
	}

	public static function uninstall() {
		delete_option( self::OPTION );
	}
}

NCC_Site::init();
register_uninstall_hook( __FILE__, array( 'NCC_Site', 'uninstall' ) );
