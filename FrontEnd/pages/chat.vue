<template>
  <div id="app" class="app">
    <div class="header">
      <h1 class="Chatroom">{{this.room_name}}</h1>
      <p class="username">Logged in as: {{ username }}</p>
      <!-- <p class="online">Online: {{ users.length }}</p> -->
      <!-- <p class="room">Room: {{ room }}</p> -->
    </div>
    <ChatRoom v-if="this.room === 'Firstroom'" v-bind:messages="messages" v-on:sendMessage="this.sendMessage" />
    <ChatRoom v-if="this.room === 'Secondroom'" v-bind:messages="messages2" v-on:sendMessage="this.sendMessage" />
    <ChatRoom v-if="this.room === 'Thirdroom'" v-bind:messages="messages3" v-on:sendMessage="this.sendMessage" />
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
    Header
  },
  mounted: {
    created() {
      window.addEventListener("keyup", this.keyPress);
    }
  },

  metaInfo: { title: "PrivaChat System V1.0" },
  // io IP default is localhost or 192.168.5.1
  data: function() {
    return {
      username: "",
      socket: io("http://192.168.1.43:3000"),
      messages: {},
      messages2: {},
      messages3: {},
      users: [],
      room: "",
      room_name: "",
      date: "",
      title: "PrivaChat"
    };
  },
 
  head() {
    return {
      title: this.title,
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        {
          hid: "description",
          name: "description",
          content: "My custom description"
        }
      ]
    };
  },
  methods: {
    check_room_name: function(){
      if(this.room === "Firstroom"){
        this.room_name = "General Room"
      }
      else if (this.room === "Secondroom"){
        this.room_name = "Secondary Room"
      }
      else{
        this.room_name = "Emergency Room"
      }
  },
    keyPress(e) {
      if (e.key === "t") {
        this.toggle();
      }
    },
    joinServer: function() {
      this.socket.on("loggedIn", data => {
        if (this.room === "Firstroom") {
          this.room_name = "General Room"
          console.log(data.messages);
          this.messages = data.messages;
        } else if (this.room === "Secondroom") {
          this.room_name = "Secondary Room"
          console.log(data.messages2);
          this.messages2 = data.messages2;
        } else if (this.room === "Thirdroom") {
          this.room_name = "Emergency Room"
          console.log(data.messages3);
          this.messages3 = data.messages3;
        }
        this.users = data.users;
        this.room = data.room;
        this.socket.emit("newuser", this.username);
      });
      this.listen();
    },
    listen: function() {
      this.socket.on("userOnline", user => {
        console.log(user)
        this.users.push(user);
      });
      this.socket.on("userLeft", user => {
        this.users.splice(this.users.indexOf(user), 1);
      });
      this.socket.on("msg_room_1", message => {
          this.messages.push(message);
      });
      this.socket.on("msg_room_2", message =>{
        this.messages2.push(message);
      })
      this.socket.on("msg_room_3", message =>{
        this.messages3.push(message);
      })
    },
    sendMessage: function(message) {
      this.socket.emit("msg", message, this.room);
      console.log("App get", message);
    }
  },
  mounted: function() {
    this.username = this.$route.params.username;
    this.room = this.$route.params.room;
    // this.username = prompt("What is your username?", "Anonymous");
    // If user null this can be happened if user refresh the app
    if (!this.username) {
      // Prevent user refresh to create null user apreared in the chat
      this.$router.push({ name: "index" });
      this.socket.disconnected();
    }
    this.joinServer();
  }
});
</script>

<style lang="scss">
body {
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
