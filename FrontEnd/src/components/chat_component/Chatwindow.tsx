import { Component } from 'react';
import styles from '@/components/chat_component/chatstyle.module.scss'
import Button from '@material-ui/core/Button';
import SendIcon from '@material-ui/icons/Send';

const ChatWindow: React.FC = () => (
    <>
    <div className={styles.chatwindow}>
      <div className={styles.messages}>
        <div className={styles.message}>
          <div className={styles.username}></div>
          <div className={styles.messagetext}></div>
          <div className={styles.messagedatetime}></div>
        </div>
      </div>
      <form className={styles.inputcontainer}>
        <input type="text"></input>
        <Button className={styles.submit}><SendIcon/> Send</Button>
      </form>
    </div>
    </>
)

export default ChatWindow