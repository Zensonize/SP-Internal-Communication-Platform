import Head from 'next/head';
import SearchAppBar from '@/components/navbar/Navbar';
import styles from '@/components/about/about.module.scss';
import Pok from '@/components/about/Pok'
import Kok from '@/components/about/Kok'
import Qew from '@/components/about/Qew'
export default function About() {
  return (
    <>
      <Head>
        <title>About us</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SearchAppBar />
      <div className={styles.aboutsection}>
        <h1>About Us</h1>
      </div>

      <h2 style={{ textAlign: 'center' }}>Our Team</h2>
      <div className={styles.container}>
        <div className={styles.item}><Pok/></div>
        <div className={styles.item}><Kok/></div>
        <div className={styles.item}><Qew/></div>
      </div>

      <style jsx global>{`
        body {
          font-family: 'Avenir', Helvetica, Arial, sans-serif;
          color: #2c3e50;
          margin: 0;
          padding: 0;
        }

        .class {
          align-items: center;
          align-content: center;
        }

        #app {
          display: flex;
          flex-direction: column;
          height: 80vh;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 15px;
          box-sizing: border-box;
        }
      `}</style>
    </>
  );
}
