<template>
  <b-navbar class="navbar" toggleable="lg" type="dark" variant="dark">
    <b-navbar-brand href="/" disabled>PrivaChat</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav>
        <b-nav-item href="/chat" disabled>Chat</b-nav-item>
      </b-navbar-nav>

      <!-- Right aligned nav items -->
      <!-- Login Form -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item @click="modalLogin = !modalLogin">Login</b-nav-item>

        <b-modal v-model="modalLogin" @ok="handlelogin">
          <div class="d-block text-center">
            <h2>Login to PrivaChat!</h2>
          </div>

          <div>
            <b-form-input
              v-model="name_auth"
              :state="name_auth_State"
              size="sm"
              placeholder="Enter your username"
            ></b-form-input>
            <b-form-invalid-feedback id="username-feedback">
              Field is required!
            </b-form-invalid-feedback>
            <b-form-input
              v-model="password_auth"
              :state="password_auth_State"
              size="sm"
              type="password"
              placeholder="Enter your password"
              aria-describedby="password-feedback"
            ></b-form-input>
            <b-form-invalid-feedback id="password-feedback">
              Field is required!
            </b-form-invalid-feedback>
            <b-form-select v-model="selected" :options="options"></b-form-select>
            <div class="mt-3">Room Number: <strong>{{ selected }}</strong></div>
          </div>
        </b-modal>
        <!-- Register Form -->
        <b-nav-item @click="modalShow = !modalShow">Register</b-nav-item>
        <b-modal v-model="modalShow" @ok="handleRegister">
          <div class="d-block text-center">
            <h2>Register to PrivaChat!</h2>
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
              v-model="password_confirm"
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
          <b-dropdown-item href="#" disabled>Profile</b-dropdown-item>
          <b-dropdown-item href="#" @click="logout = !logout"
            >Sign Out</b-dropdown-item
          >
        </b-nav-item-dropdown>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
import io from "socket.io-client";
import Vuex from "vuex";
import Vue from "vue";
import axios from "@nuxtjs/axios";

Vue.use(Vuex);

export default Vue.extend({
  computed: {
    name_auth_State() {
      return this.name_auth.length > 0 ? true : false;
    },
    password_auth_State() {
      return this.password_auth.length > 0 ? true : false;
    },

    nameState() {
      return this.name.length > 2 ? true : false;
    },
    passwdState() {
      return this.password === this.password_confirm &&
        this.password != 0 &&
        this.password_confirm != 0
        ? true
        : false;
    },
    logout() {
      this.socket.disconnect();
      location.replace("/");
    }
  },
  data: function() {
    return {
      modalShow: false,
      modalLogin: false,
      name: "",
      name_auth: "",
      password_auth: "",
      password: "",
      password_confirm: "",
      socket: io("http://192.168.1.43:3000"),
      selected: null,
      options: [{ value: null, text: 'Please select chat room' },
      { value: "Firstroom", text: 'General Room' },
      { value: "Secondroom", text: 'Secondary Room' },
      { value: "Thirdroom", text: 'Emergency Room' }],
    };
  },
  methods: {
    handleRegister() {
      if (!this.name || !this.password || !this.password_confirm) {
        alert("This form Cannot empty!");
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
    },
    handlelogin() {
      if (!this.name_auth || !this.password_auth) {
        alert("This form Cannot empty!");
        return;
      }
      
      this.socket.emit("user_auth", this.name_auth, this.password_auth,this.selected);
      this.socket.on("auth_fail", payload => {
        console.log(this.selected)
        alert(payload);
        this.password_auth = "";
        this.name_auth = "";
        this.selected = "";
        this.socket.disconnect();
        location.reload();
        return;
      });
      this.socket.on("auth_success", payload => {
        let user_result = payload.map(({ registername }) => registername);
        let pass_result = payload.map(({ password }) => password);
        if (
          user_result == this.name_auth &&
          pass_result == this.password_auth
        ) {
          this.socket.emit("newuser", user_result);
          this.$router.push({
            name: "chat",
            params: { username: this.name_auth, room: this.selected }
          });
          console.log("User joined:",this.selected)
          this.selected = "";
          this.socket.disconnect();
          this.password_auth = "";
          this.name_auth = "";
        }
      });
    }
  }
});
</script>

<style>
h2,
.mt-2,.mt-3 {
  color: black;
}
.navbar {
  color: #00376f;
}
</style>
