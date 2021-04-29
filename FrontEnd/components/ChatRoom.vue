<template>
  <div class="chat-window">
    <div
      class="messages"
      v-chat-scroll="{always: false, smooth: true, scrollonremoved:true, smoothonremoved: false}"
    >
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
        <div v-if="message.data">
           <div v-if="message.data.contentType == 'image/png' 
          || message.data.contentType == 'image/jpg' 
          || message.data.contentType == 'image/jpeg' 
          || message.data.contentType == 'image/*'" >
           <b-img 
                v-bind="mainProps"
                class="image_show"
                :data-src="
                  'data:image/jpg;base64,' +
                    message.data.data
                "
                crossorigin="anonymous"
                thumbnail
                width="200"
                height="200"
                v-lazy-load
              >
              </b-img>
           </div>
               <a
                :href="
                  'data:*/*;base64,' + message.data.data
                "
                :download="message.data.name"
                target="_blank"
              >
                {{ message.data.name }}
              </a>

               <div
              id="audio"
              class="player-wrapper"
              v-if="message.data.contentType === 'audio/mpeg'"
            >
              <audio controls controlsList="nodownload" v-lazy-load>
                <source
                  :src="
                    'data:audio/mpeg;base64,' +
                      message.data.data
                  "
                  type="audio/mpeg"
                />
                Your browser does not support the audio element.
              </audio>
            </div>
        </div>

        <div class="message-text">{{ message.msg }}</div>

        <div class="message-datetime">{{ message.date }}</div>
      </div>
    </div>

    <form class="input-container" v-on:submit.prevent="sendMessage">
      <input type="text" v-model="msg" placeholder="Message here" />
      <b-form-file
        v-model="file_upload"
        id="form_file"
        ref="file-input"
        type="file"
        style="color:transparent; 
width:70px;font-size:14px;border-radius: 25px;"
        accept="*/*"
      />

      <b-button
        variant="outline-light"
        v-on:click="sendMessage"
      >
        Send
      </b-button>
    </form>
  </div>
</template>

<script>
import Vue from "vue";
import { BImg } from "bootstrap-vue";
Vue.component("b-img", BImg);
import { ImagePlugin } from "bootstrap-vue";
Vue.use(ImagePlugin);
import VueChatScroll from "vue-chat-scroll";

Vue.use(VueChatScroll);

export default Vue.extend({
  name: "chatroom",
  props: ["messages"],
  components: {
  },
  metaInfo: { title: "Emergency Chat System V1.0" },
  data: function() {
    return {
      msg: "",
      date: "",
      username: "",
      file_upload: null,
      mainProps: {
        show: true,
        thumbnail: true,
        fluidGrow: true,
        blank: true,
        blankColor: "#bbb",
     
      }
    };
  },
  computed: {},
  watch:{},
  mounted: function() {
    this.username = this.$route.params.username;
  },
  methods: {
    sendMessage: function() {
      if (this.file_upload) {
        var path = document
          .getElementById("form_file")
          .value.split("\\")
          .pop();
        this.msg = path.toString();
        console.log(
          `file upload: ,${this.file_upload}, ${this.file_upload.type} , ${
            this.file_upload.name
          }, ${this.file_upload.size / 1024} KB`
        );
        
        this.$emit("sendMessage", {
          msg: this.msg,
          date: Date().toLocaleString(),
          file: this.file_upload,
          file_name: this.file_upload.name,
          content_type: this.file_upload.type
        });
      
      } 
      else if (!this.msg || this.msg.match(/^\s+$/) !== null) {
        alert("Please enter a message");
        return;
      }
      else {
        // console.log("No file upload")
        this.$emit("sendMessage", {
          msg: this.msg,
          date: Date().toLocaleString()
        });
      }

      // console.log(this.username, this.$route.params.username);
      console.log("ChatRoom sent:", this.msg, this.date);
      this.msg = "";
      this.date = "";
      this.file_upload = null;
    },
    convertBinaryToBase64(input) {
      var b = new Buffer.from(input);
      // If we don't use toString(), JavaScript assumes we want to convert the object to utf8.
      // We can make it convert to other formats by passing the encoding type to toString().
      return b.toString("base64");
    },
    lazyLoadImage(e) {
      let media = e.target.parentNode.querySelectorAll("[data-manual-lazy]");
      [...media].forEach(m => this.$lazyLoad(m));
    }
  }
});
</script>

<style lang="scss" scoped>
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--border-color);
  box-shadow: 1px 1px 6px 0px rgba(0, 0, 0, 0.15);
  max-height: 89%;
  
  // word-break: break-word;
  .message-out {
    // me or myself
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--bg);
    margin-left: 42.5%;
    margin-right: 5px;
    float: right;
    word-break: break-word;
    audio::-webkit-media-controls-enclosure {
      background-color: var(--color-primary);
      overflow: hidden;
    }

    audio::-webkit-media-controls-panel {
      background-color: var(--color-primary);
      width: calc(100% + 30px);
    }
    // text-align: right;
  }
  .message-in {
    // other user
    word-break: break-word;
    float: left;
    margin-right: 42.5%;
    background: var(--color-secondary);
    border-color: var(--color-secondary);
    margin-left: 5px;
    color: var(--bg);
    audio::-webkit-media-controls-enclosure {
      background-color: var(--color-secondary);
      overflow: hidden;
    }

    audio::-webkit-media-controls-panel {
      background-color: var(--color-secondary);
      width: calc(100% + 30px);
    }
  }
  .messages {
    flex: 1;
    overflow: auto;
    .message {
      margin-bottom: 0.5em;
      font-size: 0.8em;
      border-radius: 10px;
      padding: 10px;

      &:last-of-type {
        border-bottom: none;
      }

      .username {
        // margin-right: 15px;
        margin-top: 4px;
        font-size: 0.7rem;
        flex: 0.1;
      }

      .message-text {
        margin-right: 5px;
        flex: 1;
      }
      .message-datetime {
        // flex: 1;
        margin-top: 6px;
        font-size: 0.6rem;
      }
    }
  }
  .input-container {
    overflow-x: auto;

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
