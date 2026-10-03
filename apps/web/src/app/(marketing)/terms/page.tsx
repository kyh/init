import { SitePageView, sitePageMetadata } from "@/app/(marketing)/_components/site-page-view";
import { terms } from "@/lib/agent/terms-of-use";

export const metadata = sitePageMetadata(terms);

const TermsPage = () => <SitePageView page={terms} />;

export default TermsPage;
