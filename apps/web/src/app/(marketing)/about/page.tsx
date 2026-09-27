import { SitePageView, sitePageMetadata } from "@/app/(marketing)/_components/site-page-view";
import { about } from "@/lib/agent/site-pages";

export const metadata = sitePageMetadata(about);

const AboutPage = () => <SitePageView page={about} />;

export default AboutPage;
