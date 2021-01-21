<template>
  <div class="chat-window">
    <div class="messages" v-chat-scroll>
      <div
        class="message"
        v-for="message in messages"
        v-bind:key="message._id"
        :class="{
          'message-out': message.username === $route.params.username,
          'message-in': message.username !== $route.params.username
        }"
      >
        <div
          class="username"
          v-if="message.username !== $route.params.username"
        >
          {{ message.username }}
        </div>
        <div class="message-text">{{ message.msg }}</div>
        <div class="message-datetime">{{ message.date }}</div>
      </div>
    </div>
    <form class="input-container" v-on:submit.prevent="sendMessage">
      <input type="text" v-model="msg" />
      
      <b-button variant="outline-light" v-on:click="sendMessage" v-bind:disabled="!msg">
        Send
      </b-button>
  
    </form>
  </div>
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  name: "chatroom",
  props: ["messages"],
  components: {},
  metaInfo: { title: "Emergency Chat System V1.0" },
  data: function() {
    return {
      msg: "",
      date: "",
      username: ""
    };
  },
  mounted: function() {
    this.username = this.$route.params.username;
  },
  methods: {
    sendMessage: function() {
      this.date = Date().toLocaleString();
      if (!this.msg) {
        alert("Please enter a message");
        return;
      }
      this.$emit("sendMessage", this.msg, this.date);
      console.log(this.username, this.$route.params.username);
      console.log("ChatRoom sent:", this.msg, this.date);
      this.msg = "";
      this.date = "";
    }
  }
});
</script>

<style lang="scss" scoped>

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  // margin: auto;
  background-color: var(--border-color);
  box-shadow: 1px 1px 6px 0px rgba(0, 0, 0, 0.15);
  max-height: 70%;
  .message-out {
    background:var(--color-primary);
    border-color: var(--color-primary);
    color: var(--bg);
    margin-left: 50%;
    margin-right: 5px;
    border-radius: 10px;
    padding: 0.5em;
    margin-bottom: 0.5em;
    font-size: 0.8em;
  }
  .message-in {
    background:var(--color-secondary);
    border-color: var(--color-secondary);
    margin-left: 5px;
    color: var(--bg);
    margin-right: 50%;
    border-radius: 10px;
    padding: 0.5em;
    margin-bottom: 0.5em;
    font-size: 0.8em;
  }
  .messages {
    flex: 1;
    overflow: scroll;

    .message {
      display: flex;
      
      // border-bottom: 1px solid #efefef;
      padding: 10px;

      &:last-of-type {
        border-bottom: none;
      }
      

      .username {
        // margin-right: 15px;
        margin-top: 3.5px;
        font-size: 0.7rem;
        flex: 0.3;
      }

      .message-text {
        margin-left: 5px;
        margin-right: 5px;
        flex: 1;
      }
      .message-datetime {
        // flex: 1;
        margin-top: 4px;
        font-size: 0.6rem;
      }
    }
  }
  .input-container {
    display: flex;

    input {
      flex: 1;
      border-radius: 10px;
      height: 35px;
      font-size: 18px;
      box-sizing: border-box;
    }

    button {
      margin-left: 2px;
      border-radius: 10px;
      width: 75px;
      height: 35px;
      box-sizing: border-box;
    }
  }
}
</style>
