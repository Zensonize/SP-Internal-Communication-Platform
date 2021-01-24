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
        <b-modal
          v-model="modalLogin"
          @ok="handlelogin"
          title="Login to PrivaChat!"
        >
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
            <div>
              <b-form-select
                v-model="selected"
                :options="options"
                style="width:80%"
              ></b-form-select>
              <b-button
                variant="outline-primary"
                style="margin-left:0.5rem;"
                @click="getroom_list"
                >Refresh</b-button
              >
            </div>
            <div class="mt-3">
              Room selected: <strong>{{ selected }}</strong>
            </div>
          </div>
        </b-modal>
        <!-- Register Form -->
        <b-nav-item @click="modalShow = !modalShow">Register</b-nav-item>
        <b-modal
          v-model="modalShow"
          @ok="handleRegister"
          title="Register to PrivaChat!"
        >
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
          <b-dropdown-item v-b-modal.addroom>Create new room</b-dropdown-item>
          <b-modal id="addroom" title="Addroom" @ok="addnew_room">
            <b-container fluid>
              <b-row class="my-1">
                <b-col sm="8" style="padding-left:-10px">
                  <b-form-group
                    :state="room_exist_state"
                    :invalid-feedback="invalidFeedback"
                  >
                    <b-form-input
                      v-model="Create_room"
                      :state="room_exist_state"
                      size="sm"
                      placeholder="Enter new room name eg. Priva Room"
                      style="margin-left:-15px"
                    ></b-form-input>
                  </b-form-group>
                </b-col>
                <b-col sm="4">
                  <b-button
                    variant="outline-primary"
                    size="sm"
                    @click="get_duplicate_name"
                    >Check exist room</b-button
                  ></b-col
                >
              </b-row>
            </b-container>
          </b-modal>
          <b-dropdown-item v-b-modal.modal-1>Change-logs</b-dropdown-item>
          <b-modal id="modal-1" title="BootstrapVue">
            <p class="my-4">Not Avaliable now!</p>
          </b-modal>
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

Vue.use(Vuex);

export default Vue.extend({
  computed: {
    name_auth_State() {
      return this.name_auth.length > 0 ? true : false;
    },
    password_auth_State() {
      return this.password_auth.length > 0 ? true : false;
    },
    room_exist_state() {
      return this.Create_room.length >= 4;
    },
    invalidFeedback() {
      if (this.Create_room === this.room_exist) {
        return "Please enter more than 4 Characters.";
      }
      return "Please enter something";
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
      /** Login **/
      name_auth: "",
      password_auth: "",
      /** Login **/

      /** Register **/
      name: "",
      password: "",
      password_confirm: "",
      /** Register **/

      /** Room **/
      Create_room: "",
      /** Room **/
      socket: io("http://192.168.1.43:3000"), // this IP can be changeable
      selected: null,
      options: [
        { value: null, text: "Click refresh to select chat room" },
      ]
    };
  },
  methods: {
    getroom_list(){
      this.socket.emit("get_room_list","User_request")
      this.socket.on("room_lists_result", (payload) => {
        console.log("Get Lists")
        payload.map(({RoomID}) => RoomID).forEach((element) => {
          this.options.push(element)
            console.log(element)
        });
      })
    },
    // Get room list from Backend
    get_duplicate_name() {
      this.socket.emit("check_exist_room", this.Create_room);
      this.socket.on("able_to_create", payload => {
        alert(payload);
      });
      this.socket.on("unable_to_create", payload => {
        alert(payload);
      });
    },
    // Handle add new room
    addnew_room() {
      this.socket.emit("user_create_room", this.Create_room);
      this.Create_room = "";
      this.socket.on("create_success", payload => {
        alert(payload);
      });
    },
    // Handle add new user
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
    // Handle login user
    handlelogin() {
      if (!this.name_auth || !this.password_auth) {
        alert("This form Cannot empty!");
        return;
      }
      this.socket.emit(
        "user_auth",
        this.name_auth,
        this.password_auth,
        this.selected
      );
      this.socket.on("auth_fail", payload => {
        console.log(this.selected);
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
          console.log("User joined:", this.selected);
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

<style></style>
