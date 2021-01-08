import { Component } from 'react';
import io from 'socket.io-client';
import SearchAppBar from '@/components/navbar/Navbar';
import styles from '@/components/chat_component/chatstyle.module.scss';
import ChatWindow from '@/components/chat_component/Chatwindow';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Head from 'next/head'

interface MsgPayload {
  username: string;
  messages: string[];
  user: string[];
  date: Date | null;
}

export default function Chat() {
  return (
    <>
     <Head>
        <title>MaChat</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SearchAppBar />
      <div id="app" className={styles.app} style={{marginTop:"40px"}}>
        <div className="header">
          <h1 className={styles.Chatroom}>Chatroom</h1>
          <p className={styles.username}>Username: </p>
          <p className="online">Online:</p>
        </div>
        <ChatWindow />
      </div>
      <style jsx>{`
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
