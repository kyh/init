import { SitePageView, sitePageMetadata } from "@/app/(marketing)/_components/site-page-view";
import { privacy } from "@/lib/agent/site-pages";

export const metadata = sitePageMetadata(privacy);

const PrivacyPage = () => <SitePageView page={privacy} />;

export default PrivacyPage;
