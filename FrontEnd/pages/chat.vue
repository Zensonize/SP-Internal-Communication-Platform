<template>
  <div id="app" class="app">
      
    <div class="header">
      <h1 class="Chatroom">Chatroom</h1>
      <p class="username">Username: {{ username }}</p>
      <p class="online">Online: {{ users.length }}</p>
    </div>
    <ChatRoom v-bind:messages="messages" v-on:sendMessage="this.sendMessage" />
  </div>
</template>

<script>
import io from "socket.io-client";
import ChatRoom from "../components/ChatRoom";
import Vue from "vue";
import Header from "../components/Header";

export default Vue.extend({
  name: "app",
  components: {
    ChatRoom,
    Header,
  },
  mounted: {
created() {
    window.addEventListener("keyup", this.keyPress);
  },
  },
  
  metaInfo: { title: "Emergency Chat System V1.0" },
  // localhost:3000

  data: function() {
    return {
      username: "",
      socket: io("http://192.168.1.43:3000"),
      messages: "",
      users: "",
      date: "",
      title: "Machat"
    };
  },
  head(){
          return {
            title: this.title,
            meta: [
          // hid is used as unique identifier. Do not use `vmid` for it as it will not work
          {
            hid: 'description',
            name: 'description',
            content: 'My custom description'
          }
        ]
          }
        },
  methods: {
    keyPress(e) {
      if (e.key === "t") {
        this.toggle();
      }
    },
    joinServer: function() {
      this.socket.on("loggedIn", (data) => {
        this.messages = data.messages;
        this.users = data.users;
        this.socket.emit("newuser", this.username);
      });
      this.listen();
    },

    listen: function() {
      this.socket.on("userOnline", (user) => {
        this.users.push(user);
      });
      this.socket.on("userLeft", (user) => {
        this.users.splice(this.users.indexOf(user), 1);
      });
      this.socket.on("msg", (message) => {
        this.messages.push(message);
      });
    },
    sendMessage: function(message) {
      this.socket.emit("msg", message);
      console.log("App get", message);
    },
  },

  mounted: function() {
    this.username = prompt("What is your username?", "Anonymous");
    if (!this.username) {
      this.username = "Anonymous";
    }
    this.joinServer();
  },
});
</script>

<style lang="scss">


body {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
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
  height: 100vh;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  padding: 15px;
  box-sizing: border-box;
}
.Chatroom {
  text-align: center;
}
</style>
