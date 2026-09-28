import { SitePageView, sitePageMetadata } from "@/app/(marketing)/_components/site-page-view";
import { contact } from "@/lib/agent/site-pages";

export const metadata = sitePageMetadata(contact);

const ContactPage = () => <SitePageView page={contact} />;

export default ContactPage;
