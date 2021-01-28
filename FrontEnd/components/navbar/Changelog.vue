<template>
    <b-toast id="modal-1" title="Change-logs" auto-hide-delay="10000">
      <template #toast-title>
        <div class="d-flex flex-grow-1 align-items-baseline">
          <b-img blank blank-color="#ff5555" class="mr-2" width="12" height="12"></b-img>
          <strong class="mr-auto">Notice!</strong>
          <small class="text-muted mr-2">updated at 28 Jan 2021</small>
        </div>
      </template>
            <p class="my-2">
              - 28 Jan 21: Update new mechanism to prevent user create duplicate room name <br>
              - Change-logs change from pop-up to toast <br>
              - Prevent user login without select the room before login <br>
              - Update new create room design <br>
              - 26 Jan 21: Change version from 1.0.0 to 1.0.0alpha stage <br>
              - Remove unnecessary depencies <br>
              - 24 Jan 21: User now can join any room without leak messages (Prevent mechanism). 
              <br>- 23 Jan 21: New UI Frontend design, <br> user now can join and create each room also schema in the same time. <br>
              - 22 Jan 21: New Chat UI design! more friendly design. <br>
              - 20 Jan 21: messages in history can only show in the group that they have joined. <br>
              - 16 Jan 21: New Authen mechanism and about page.<br>
              - 12 Jan 21: Create Nav bar, new logo of PrivaChat (Qew's Design) <br>
              - 11 Jan 21: Dark mode implements with using detect dark/light mode from the system each platform. (Nuxt Features)<br>
              - Migrate from Vue to Nuxt. <br>
              - 6 Jun 20: Add Digital Clock, logo from Vue <br>
            </p>
            
    </b-toast>
</template>


<script>

import Vue from "vue";

export default Vue.extend({
    
})
</script>