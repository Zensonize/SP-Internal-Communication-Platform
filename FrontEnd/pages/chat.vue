<template>
  <div id="app" class="app">
    <div class="header">
      <h1 class="Chatroom">{{ this.room }}</h1>
      <p class="username">Logged in as: {{ this.username }}</p>
      <!-- <p class="online">Online: {{ users.length }}</p> -->
      <!-- <p class="room">Room: {{ room }}</p> -->
    </div>
    <ChatRoom  v-bind:messages="messages" v-on:sendMessage="this.sendMessage" />
  </div>
</template>

<script>
import io from "socket.io-client";
import ChatRoom from "../components/ChatRoom";
import Vue from "vue";
import config from "@/store/config.js"
import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload)


export default Vue.extend({
  name: "app",
  components: {
    ChatRoom
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
      socket: io(config.host),
      messages: [],
      users: [],
      room: "",
      room_lists: [],
      date: "",
      title: "PrivaChat"
    };
  },

  head() {
    return {
      title: "Room: " + this.room,
      meta: [
        // hid is used as unique identifier. Do not use `vmid` for it as it will not work
        {
          hid: "PrivaChat",
          name: "description",
          content: "My custom description"
        }
      ]
    };
  },
  methods: {
    keyPress(e) {
      if (e.key === "t") {
        this.toggle();
      }
    },
    joinServer: function() {
      this.socket.on("loggedIn", data => {
        // console.log(`retrieve data from ${data}`);
        this.messages = data.messages;

        // we already got image and path now we need to show to the our chatroom
        // console.log(data.messages[1].image.path)
        this.users = data.users;
        this.room = data.room;
        this.socket.emit("newuser", this.username);
      });
      this.listen();
    },
    listen: function() {
      this.socket.on("list_rooms", (payload) => {
        payload.map(({RoomID}) => RoomID).forEach((element) => {
          this.room_lists.push(element)
            // console.log(this.room_lists)
        });
      })
      this.socket.on("userOnline", user => {
        this.users.push(user);
      });
      this.socket.on("userLeft", user => {
        this.users.splice(this.users.indexOf(user), 1);
      });
      this.socket.on("msg_room", message => {
        this.messages.push(message);
      
      });
    },
    sendMessage: function(message) {
      this.socket.emit("msg", message, this.room, this.username);
      // console.log("App get", message);
    }
  },
  mounted: function() {
    this.username = this.$route.params.username;
    this.room = this.$route.params.room;
    // If user null this can be happened if user refresh the app
    if (!this.username) {
      // Prevent user refresh to create null user apreared in the chat
      this.$router.push({ name: "index" });
      // this.socket.disconnected();
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
  height: 90vh;
  // margin: 0 auto;
  padding: 15px;
  box-sizing: border-box;
}
.Chatroom {
  text-align: center;
}
</style>
