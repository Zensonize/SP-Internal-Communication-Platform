<template>
  <v-app style="background: #303030;">
    <v-navigation-drawer
      v-model="drawer"
      app
      mobile-break-point="650"
      color="$accent"
    >
      <v-list subheader class="users">
        <v-subheader>Users in room</v-subheader>

        <v-list-item
          v-for="({ name, id }, index) in users"
          :key="`user-${index}`"
          @click.prevent
        >
          <v-list-item-content>
            <v-list-item-title v-text="name" />
          </v-list-item-content>

          <v-list-item-icon>
            <v-icon :color="id === user.id ? 'green' : 'grey'">
              <!-- change color from primary to green -->
              <!-- for current user in chat not a offline or online status -->
              mdi-checkbox-blank-circle
              <!-- mdi-account-circle -->
            </v-icon>
          </v-list-item-icon>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="#424242"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>
        Room
        <v-chip color="blue">
          {{ user.room }}
        </v-chip>
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        icon
        class="mx-1"
        @click="exit"
      >
        <v-icon>mdi-exit-to-app</v-icon>
      </v-btn>
    </v-app-bar>

    <v-content>
      <v-container
        fluid
        style="height: 100%;"
      >
        <nuxt />
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import { mapState, mapMutations, mapActions } from "vuex";

export default {
  name: "ChatLayout",
  data: () => ({
    drawer: true,
  }),
  computed: {
    ...mapState(["user", "users"]),
  },
  middleware: "auth",
  created() {
    this.joinRoom(this.user);
  },
  methods: {
    ...mapActions(["joinRoom", "leftRoom"]),
    exit() {
      this.leftRoom();
      this.$router.push("/?message=leftChat");
    },
  },
};
</script>
<style lang="scss">
  @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@200&family=Roboto:wght@300&display=swap');
  @font-face {
  font-family: 'db_adman_xlight';
  src: url('~assets/fonts/db-adman-x-li-webfont.woff2') format('woff2'),
       url('~assets/fonts/db-adman-x-li-webfont.woff') format('woff'),
       url('~assets/fonts/db-adman-x.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
.users{
  font-family:  'Kanit', sans-serif;
}
</style>