//! What the window may show. The web app's own pages load in it, and so do the OAuth
//! providers sign-in navigates to; any other web page opens in the system browser instead.

use tauri::Url;

/// OAuth must navigate inside the window. Keep these aligned with the configured auth providers.
const OAUTH_ORIGINS: &[&str] = &["https://github.com"];

#[derive(Debug, PartialEq, Eq)]
pub enum Verdict {
    Allow,
    OpenExternally,
    Deny,
}

/// Compared by origin, never by prefix: `http://localhost:3000` prefixes `http://localhost:30001`.
pub fn classify(target: &Url, app_url: &Url) -> Verdict {
    let origin = target.origin();
    if origin == app_url.origin()
        || OAUTH_ORIGINS
            .iter()
            .any(|allowed| origin.ascii_serialization() == *allowed)
    {
        return Verdict::Allow;
    }
    if is_web_url(target) {
        Verdict::OpenExternally
    } else {
        Verdict::Deny
    }
}

pub fn is_web_url(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn url(value: &str) -> Url {
        Url::parse(value).unwrap_or_else(|error| panic!("{value}: {error}"))
    }

    #[test]
    fn allows_the_app_origin_on_any_path() {
        let app = url("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://init.kyh.io/dashboard?tab=1"), &app),
            Verdict::Allow
        );
    }

    #[test]
    fn compares_origins_not_prefixes() {
        let app = url("http://localhost:3000/");
        assert_eq!(
            classify(&url("http://localhost:30001/"), &app),
            Verdict::OpenExternally
        );
        assert_eq!(
            classify(&url("https://localhost:3000/"), &app),
            Verdict::OpenExternally
        );
    }

    #[test]
    fn allows_the_oauth_providers() {
        let app = url("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://github.com/login/oauth/authorize"), &app),
            Verdict::Allow
        );
        assert_eq!(
            classify(&url("https://gist.github.com/"), &app),
            Verdict::OpenExternally
        );
    }

    #[test]
    fn hands_other_web_pages_to_the_browser_and_refuses_the_rest() {
        let app = url("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://example.com/"), &app),
            Verdict::OpenExternally
        );
        assert_eq!(classify(&url("file:///etc/passwd"), &app), Verdict::Deny);
        assert_eq!(classify(&url("javascript:alert(1)"), &app), Verdict::Deny);
    }
}
