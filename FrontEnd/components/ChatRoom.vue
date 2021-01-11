<template>
  <div class="chat-window">
    <div class="messages">
      <div class="message" v-for="message in messages" v-bind:key="message._id">
        <div class="username">{{ message.username }}</div>
        <div class="message-text">{{ message.msg }}</div>
        <div class="message-datetime">{{ message.date }}</div>
      </div>
    </div>
    <form class="input-container" v-on:submit.prevent="sendMessage">
      <input type="text" v-model="msg" />
      <button v-on:click="sendMessage" v-bind:disabled="!msg">
        Send
      </button>
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
    };
  },
  methods: {
    sendMessage: function() {
      this.date = Date().toLocaleString();
      if (!this.msg) {
        alert("Please enter a message");
        return;
      }
      this.$emit("sendMessage", this.msg, this.date);

      console.log("ChatRoom sent:", this.msg, this.date);
      this.msg = "";
      this.date = "";
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #a3a3a3;
  box-shadow: 1px 1px 6px 0px rgba(0, 0, 0, 0.15);
  max-height: 70%;
  .messages {
    flex: 1;
    overflow: scroll;

    .message {
      display: flex;
      border-bottom: 1px solid #efefef;
      padding: 10px;

      &:last-of-type {
        border-bottom: none;
      }

      .username {
        width: 100px;
        margin-right: 15px;
      }

      .message-text {
        flex: 1;
      }
      .message-datetime {
        flex: 1;
      }
    }
  }
  .input-container {
    display: flex;

    input {
      flex: 1;
      height: 35px;
      font-size: 18px;
      box-sizing: border-box;
    }

    button {
      width: 75px;
      height: 35px;
      box-sizing: border-box;
    }
  }
}
</style>
