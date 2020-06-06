<template>
  <v-row
    no-gutters
    align="center"
    justify="center"
  >

    <v-col cols="auto">
      <p align="center"> <logo/></p>
      
      <v-card
        min-width="290"
        color="#424242"
      >
      
        <Snackbar
          v-model="snackbar"
          :text="message"
        />

        <v-card-title>
          <h2>Login</h2>
        </v-card-title>
        <v-card-text>
          <v-form
            ref="form"
            v-model="isValid"
            lazy-validation
            @submit.prevent="submit"
          >
            <v-text-field
              v-model="user.name"
              :counter="16"
              :rules="nameRules"
              label="Name"
              required
              class="Name"
            />
            <v-text-field
              v-model="user.room"
              :counter="16"
              :rules="roomRules"
              label="Enter the room"
              required
              class="room"
            />
            <v-btn
              :disabled="!isValid"
              color="primary"
              class="mt-3"
              type="submit"
            >
              Submit
            </v-btn>
          </v-form>
          
        </v-card-text>
      </v-card>
      <p align="center">Nuxt.JS Chat v0.1</p>
    </v-col>
    
  </v-row>
</template>

<script>
import { mapActions } from "vuex";
import Snackbar from "@/components/Snackbar";
import messageDict from "@/lib/messageDict";
import Logo from '~/components/Logo.vue'

export default {
  name: "Home",
  layout: "login",
  components: {
    Snackbar,Logo
  },
  data: () => ({
    isValid: true,
    user: {
      name: "",
      room: "",
      typingStatus: false,
    },
    nameRules: [
      v => !!v || "Name is required",
      v => (v && v.length <= 16) || "Name must be less than 16 characters",
    ],
    roomRules: [
      v => !!v || "Enter the room",
      v => (v && v.length <= 16) || "Room must be less than 16 characters",
    ],
    snackbar: false,
  }),
  computed: {
    message() {
      const { message } = this.$route.query;
      return messageDict[message] || "";
    },
  },
  mounted() {
    this.snackbar = !!this.message;
  },

  methods: {
    ...mapActions(["createUser"]),
    submit() {
      if (this.$refs.form.validate()) {
        this.createUser(this.user);
        this.$router.push("/chat");
      }
    },
  },

  head: {
    title: "nuxt-chat-app",
  },
};
</script>

<style lang="scss">
@font-face {
    font-family: 'db_adman_xlight';
    src: url('~assets/fonts/db-adman-x-li-webfont.woff2') format('woff2'),
         url('~assets/fonts/db-adman-x-li-webfont.woff') format('woff'),
         url('~assets/fonts/db-adman-x.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
}
 body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue','Kanit', sans-serif,'Sriracha', cursive,'db_adman_xlight';
    background-color: var(--bg);
    color: var(--color);
    transition: background-color .3s;
  }
  a {
    color: var(--color-primary)
  }
h2, p, .Name,.room,.mt-3 {
   font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, 'Helvetica Neue', Arial,'Kanit', sans-serif,'Sriracha', cursive,'db_adman_xlight';

}
</style>