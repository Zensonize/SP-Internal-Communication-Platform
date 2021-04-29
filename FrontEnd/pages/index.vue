<template>
  <div class="container">
    <div>
      <Logo />
      <h1 class="title">
        PrivaChat
      </h1>
      <h2 class="clock">
ขณะนี้เวลา : <digital-clock :blink="true" :displaySeconds="true" />
      </h2>
      <div class="links">
        <b-button
          @click="modalLogin = !modalLogin"
          target="_blank"
          rel="noopener noreferrer"
          class="button--green"
          variant="outline-success"
        >
          Login
        </b-button>

          <b-modal
          v-model="modalLogin"
          @ok="handlelogin"
          @show="getroom_list"
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
              
            </div>
            <div class="mt-3">
              Room selected: <strong>{{ selected }}</strong>
            </div>
          </div>
        </b-modal>

        <b-button
          target="_blank"
          rel="noopener noreferrer"
          class="button--grey"
          variant="outline-light"
          @click="modalRegister = !modalRegister"
        >
          Register
        </b-button>
      
       <b-modal
          v-model="modalRegister"
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
      </div>
      <ColorModePicker />
      <p class="created">based on Socket IO, NuxtTS</p>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import ColorModePicker from "@/components/ColorModePicker.vue";
import DigitalClock from "vue-digital-clock";
import VueSidebarMenu from "vue-sidebar-menu";
import "vue-sidebar-menu/dist/vue-sidebar-menu.css";
import io from "socket.io-client";
import Vuex from "vuex";
import config from "@/store/config"
Vue.use(Vuex)
Vue.use(VueSidebarMenu);
export default Vue.extend({
  name: "PrivaChat",
  components: {
    ColorModePicker,
    DigitalClock
  },
  computed:{
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
    }
  },
  data() {
    return {
      title: "PrivaChat",
      socket: io(config.host), // this IP can be changeable
      
      modalRegister: false,
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
      
      selected: null,
      options: [{ value: null, text: "Click to select chat room" }]
    };
  },
  head() {
    return {
      title: this.title
    };
  },
  methods:{
    getroom_list() {
        this.socket.emit("get_room_list", "User_request");
        this.socket.on("room_lists_result", payload => {
        console.log("Get Lists");
        payload
          .map(({ RoomID }) => RoomID)
          .forEach(element => {
            if (payload.length === this.options.length - 1){
              return
            }
            else {
              this.options.push(element);
            }
            console.log(element);
          }); 
      }); 
    },
    handlelogin() {
      if (!this.name_auth || !this.password_auth || !this.selected  ) {
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
        alert(payload);
        this.password_auth = "";
        this.name_auth = "";
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
            params: { username: this.name_auth, room: this.selected   }
          });
          this.socket.disconnect();
          this.selected = "";
          this.password_auth = "";
          this.name_auth = "";
          
        }
      });
    },
     handleRegister() {
      if (!this.name || !this.password || !this.password_confirm) {
        alert("This form Cannot empty!");
        return;
      }
      else{
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
    }
  }
});
</script>
