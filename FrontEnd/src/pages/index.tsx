import React from 'react';
import Head from 'next/head';
import MenuAppBar from '@/components/navbar/Navbar';
import Title from '@/components/Title';
import FormDialog from '@/components/register/register.component'

const Home: React.FC = () => (
  <>
    <MenuAppBar />
    {/* <AppBar/> */}
    <div className="container">
      <Head>
        <title>MaChat</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Title />
        <p className="description">Individual application chat and offline based on socket-io</p>
        <FormDialog/>
      </main>

      <style jsx global>
        {`
          .container {
            padding: 0 0.5rem;
            display: flex;
            flex-direction: column;
          }

          main {
            padding: 3rem 0.25rem;
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }

          a {
            color: inherit;
            text-decoration: none;
          }

          .description {
            text-align: center;
          }

          .description {
            line-height: 1.5;
            font-size: 1.5rem;
          }
        `}
      </style>
    </div>
  </>
);

export default Home;
