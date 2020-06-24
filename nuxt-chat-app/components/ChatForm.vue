<template>
  <v-form ref="form" @submit.prevent="send">
    <v-text-field
      v-model="text"
      label="Message..."
      outlined
      :rules="rules"
      append-icon="mdi-send-circle-outline"
      @input="typing"
      @click:append="send"
      @blur="resetValidation"
    />
    
    
  </v-form>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import Emoji from "vue-emoji-picker";
import EmojiPicker from "./EmojiPicker";
import VEmojiPicker from 'v-emoji-picker';
import { Picker } from 'emoji-mart-vue';


export default {
  components: {
    EmojiPicker,Emoji,VEmojiPicker,Picker ,
  },
  data: () => ({
    text: "",
    rules: [(v) => !!v || "Text is required"],
      selectEmoji(emoji) {
      console.log(emoji);
    },
  }),
  computed: {
    ...mapGetters(["typingStatus"]),
  },
  methods: {
    ...mapActions(["createMessage", "setTypingStatus"]),
    send() {
      if (this.$refs.form.validate()) {
        this.createMessage(this.text);
        this.text = "";

        this.setTypingStatus(false);
        this.resetValidation();
      }
    },
    insert(emoji) {
      this.input += emoji;
    },
    resetValidation() {
      this.$refs.form.resetValidation();
    },
    typing() {
      if (!this.typingStatus) {
        this.setTypingStatus(true);
      }
    },
  },
};
</script>
