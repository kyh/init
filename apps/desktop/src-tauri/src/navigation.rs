//! What the window may show. The web app's own pages load in it, and so do the OAuth
//! providers sign-in navigates to; any other web page opens in the system browser instead.

use tauri::Url;

/// OAuth must navigate inside the window. Keep these aligned with the configured auth providers.
const OAUTH_ORIGINS: &[&str] = &["https://github.com"];

/// The dev-only GitHub emulator (`pnpm emulate`), named by the variable the web app's
/// `genericOAuth` provider reads (`packages/service/src/auth/auth.ts`).
const EMULATOR_URL_VAR: &str = "NEXT_PUBLIC_GITHUB_EMULATOR_URL";

#[derive(Debug, PartialEq, Eq)]
pub enum Verdict {
    Allow,
    OpenExternally,
    Deny,
}

/// The origins the window keeps: the web app's, the OAuth providers', and under `tauri dev`
/// the emulator's when one is configured.
pub fn allowed_origins(app_url: &Url, emulator: Option<&str>) -> Vec<String> {
    let mut allowed = vec![app_url.origin().ascii_serialization()];
    allowed.extend(OAUTH_ORIGINS.iter().map(|origin| (*origin).to_owned()));
    if let Some(url) = emulator.and_then(|value| Url::parse(value).ok()) {
        allowed.push(url.origin().ascii_serialization());
    }
    allowed
}

pub fn emulator_url() -> Option<String> {
    if tauri::is_dev() {
        std::env::var(EMULATOR_URL_VAR).ok()
    } else {
        None
    }
}

/// Compared by origin, never by prefix: `http://localhost:3000` prefixes `http://localhost:30001`.
pub fn classify(target: &Url, allowed: &[String]) -> Verdict {
    let origin = target.origin();
    // an opaque origin (a non-web scheme) serializes as "null", which no allowed origin is
    if origin.is_tuple() && allowed.contains(&origin.ascii_serialization()) {
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

    fn pin(app: &str) -> Vec<String> {
        allowed_origins(&url(app), None)
    }

    #[test]
    fn allows_the_app_origin_on_any_path() {
        let allowed = pin("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://init.kyh.io/dashboard?tab=1"), &allowed),
            Verdict::Allow
        );
    }

    #[test]
    fn compares_origins_not_prefixes() {
        let allowed = pin("http://localhost:3000/");
        assert_eq!(
            classify(&url("http://localhost:30001/"), &allowed),
            Verdict::OpenExternally
        );
        assert_eq!(
            classify(&url("https://localhost:3000/"), &allowed),
            Verdict::OpenExternally
        );
    }

    #[test]
    fn allows_the_oauth_providers() {
        let allowed = pin("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://github.com/login/oauth/authorize"), &allowed),
            Verdict::Allow
        );
        assert_eq!(
            classify(&url("https://gist.github.com/"), &allowed),
            Verdict::OpenExternally
        );
    }

    #[test]
    fn allows_the_emulator_only_when_configured() {
        let app = url("http://localhost:3000/");
        let authorize = url("http://localhost:4000/login/oauth/authorize");
        assert_eq!(
            classify(&authorize, &allowed_origins(&app, None)),
            Verdict::OpenExternally
        );
        assert_eq!(
            classify(
                &authorize,
                &allowed_origins(&app, Some("http://localhost:4000"))
            ),
            Verdict::Allow
        );
        assert_eq!(
            allowed_origins(&app, Some("not a url")),
            allowed_origins(&app, None)
        );
    }

    #[test]
    fn hands_other_web_pages_to_the_browser_and_refuses_the_rest() {
        let allowed = pin("https://init.kyh.io/");
        assert_eq!(
            classify(&url("https://example.com/"), &allowed),
            Verdict::OpenExternally
        );
        assert_eq!(
            classify(&url("file:///etc/passwd"), &allowed),
            Verdict::Deny
        );
        assert_eq!(
            classify(&url("javascript:alert(1)"), &allowed),
            Verdict::Deny
        );
        assert_eq!(classify(&url("about:blank"), &allowed), Verdict::Deny);
    }
}
