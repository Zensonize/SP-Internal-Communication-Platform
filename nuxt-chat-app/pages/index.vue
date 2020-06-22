<template>
  <v-row
    no-gutters
    align="center"
    justify="center"
  >
    <v-col cols="auto">
      <p align="center"> <logo/></p>
      <p align="center" class="time"> ขณะนี้เวลา <digital-clock :blink="true" :displaySeconds="true" /> </p>
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
              join
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>
     
      <p align="center">Nuxt.JS Chat v0.1 <br> 
      </p>
    </v-col>
  </v-row>
</template>

<script>
import { mapActions } from "vuex";
import Snackbar from "@/components/Snackbar";
import messageDict from "@/lib/messageDict";
import Logo from '~/components/Logo.vue';
import offline from 'v-offline';
import ColorModePicker from '@/components/ColorModePicker';
import DigitalClock from "vue-digital-clock";

export default {
  name: "NuxtChat",
  layout: "login",
  components: {
    Snackbar,Logo,DigitalClock,
  },
   data() {
        return {
            dateTime: this.$moment(),
        };
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
    handleConnectivityChange(status) {
      console.log(status);
    },
  },

  head: {
    title: "Nuxt Chat",
  },
};
</script>
<style lang="scss">
  @import './assets/variables.scss';
</style>