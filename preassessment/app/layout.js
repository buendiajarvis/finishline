import './globals.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Free AI Readiness Assessment | Finish Line MSP',
  description: 'A quick, tailored assessment that shows exactly where AI and automation can help your organization.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <div style={{ paddingTop: '56px' }}>{children}</div>
        <Footer />
      </body>
    </html>
  );
}
