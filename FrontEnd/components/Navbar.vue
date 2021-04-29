<template>
  <b-navbar class="navbar" toggleable="lg" type="dark" variant="dark">
    <b-navbar-brand  disabled>PrivaChat</b-navbar-brand>

    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

    <b-collapse id="nav-collapse" is-nav>
      <!-- Right aligned nav items -->
      <!-- Login Form -->
      <b-navbar-nav class="ml-auto">
        <b-nav-item v-b-modal.addroom>Create New Room</b-nav-item>
         <b-modal id="addroom" title="Addroom" @ok="addnew_room">
            <b-container fluid>
              <b-row class="my-1">
                <b-col sm="12" style="padding-left:-10px">
                  <b-form-group
                    :state="room_exist_state"
                    :invalid-feedback="invalidFeedback"
                  >
                    <b-form-input
                      v-model="Create_room"
                      :state="room_exist_state"
                      size="sm"
                      placeholder="Enter new room name eg. Priva Room"
                    ></b-form-input>
                  </b-form-group>
                </b-col>
                
              </b-row>
            </b-container>
          </b-modal>
        <!-- Change-logs -->
        <b-nav-item v-b-modal.modal-1 @click="$bvToast.show('modal-1')">Change-logs</b-nav-item>
        <changelog />

        <b-nav-item-dropdown right>
          <!-- Options slot -->
          <template #button-content>
            <em>Options</em>
          </template>
          <b-dropdown-item href="/about">About</b-dropdown-item>
          
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
import Changelog from "@/components/navbar/Changelog";
import config from "@/store/config"

Vue.use(Vuex);

export default Vue.extend({
  components: {
    Changelog
  },
  computed: {
    room_exist_state() {
      return this.Create_room.length >= 4;
    },
    invalidFeedback() {
      if (this.Create_room.length) {
        return "Please enter more than 4 Characters.";
      }
      return "Please enter some character";
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

      /** Room **/
      Create_room: "",
      /** Room **/
      socket: io(config.host), // this IP can be changeable
    };
  },
  methods: {
    // Handle add new room and also check existed room name
    addnew_room() {
      if(!this.Create_room || this.Create_room.length <= 3) {
        alert("This form cannot be empty or less than 4 characters")
        return;
      }
      this.socket.emit("user_create_room", this.Create_room)
        this.socket.on("unable_to_create", (payload) => {
        alert(payload.msg);
        this.Check_duplicate_Room = payload.room_existed
        return -1
      });
        this.Create_room = "";
      this.socket.on("create_success", payload => {
        alert(payload);
      });
    },
  }
});
</script>
