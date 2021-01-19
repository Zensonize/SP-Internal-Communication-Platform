<template>
  <b-row>
    <b-col cols="12">
      <h2>
        Room List
        <b-link href="/add-room">(Add Room)</b-link>
      </h2>
      <b-list-group>
          <b-list-group-item v-for="room in rooms" :key="room.key" :to="{name: 'Chat', params: {nickname: nickname, roomid: room.key, roomname: room.roomName}}" action>
              {{room.roomName}}
          </b-list-group-item>
      </b-list-group>
    </b-col>
  </b-row>
</template>

<script>

export default {
  name: 'RoomList',
  
}
</script>
