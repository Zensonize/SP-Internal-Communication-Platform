<template>
  <b-navbar toggleable="lg" type="dark" variant="info">
    <b-navbar-brand href="/">MaChat</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item href="/chat">Chat</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item @click="modalShow = !modalShow">Register</b-nav-item>
        <b-modal v-model="modalShow" @ok="handleOk">
          <div class="d-block text-center">
            <h2>Register to MaChat!</h2>
          </div>
          <div>
            <b-form-input
              v-model="name"
              :state="nameState"
              size="sm"
              placeholder="Enter your name"
              aria-describedby="input-live-help input-live-feedback"
            ></b-form-input>
            <b-form-invalid-feedback id="input-live-feedback">
              Enter at least 3 letters
            </b-form-invalid-feedback>
            <b-form-input
              v-model="password"
              :state="passwdState"
              size="sm"
              type="password"
              placeholder="Enter your password"
              aria-describedby="input-live-help password-feedback"
            ></b-form-input>

            <b-form-input
              v-model="password2"
              :state="passwdState"
              size="sm"
              type="password"
              placeholder="Confirm your password"
              aria-describedby="input-live-help password-feedback"
            ></b-form-input>
          </div>
        </b-modal>
        <b-nav-item-dropdown right>
          <!-- Using 'button-content' slot -->
          <template #button-content>
            <em>Options</em>
          </template>
          <b-dropdown-item href="#">Profile</b-dropdown-item>
          <b-dropdown-item href="#">Sign Out</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import io from "socket.io-client";

import Vue from "vue";
import axios from "@nuxtjs/axios";

export default Vue.extend({
  computed: {
    nameState() {
      return this.name.length > 2 ? true : false;
    },
    passwdState() {
      return this.password === this.password2 &&
        this.password != 0 &&
        this.password2 != 0
        ? true
        : false;
    }
  },
  data: function() {
    return {
      modalShow: false,
      name: "",
      password: "",
      socket: io("http://192.168.1.43:3000"),
      password2: ""
    };
  },
  methods: {
    handleOk() {
      if (!this.name || !this.password || !this.password2) {
        alert("Message Cannot empty!");
        return;
      }
      console.log(this.name);

      this.socket.emit("user_regis", this.name, this.password);
      this.socket.on("regis_success", msg => {
        alert(msg);
        this.socket.disconnect();
        location.reload();
        return false;
      });
      this.name = "";
      this.password = "";
      this.password2 = "";
    }
  },
  mounted: function() {}
});
</script>

<style>
h2,
.mt-2 {
  color: black;
}
</style>
