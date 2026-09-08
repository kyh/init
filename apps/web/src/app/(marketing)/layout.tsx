import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = (props: LayoutProps) => (
  <>
    <Header />
    <main>{props.children}</main>
    <Footer />
  </>
);

export default Layout;
