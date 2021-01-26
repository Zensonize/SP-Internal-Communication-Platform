<template>
  <div>
    <b-card
    header="Documentary, Driver"
      title="Qew"
      img-src="@/assets/imgs/qew.jpg"
      img-alt="Image"
      img-top
      class="qew"
      v-lazy-load
    >
     <b-card-sub-title class="mb-2">aka QewLegend</b-card-sub-title>
      <b-card-text >
        "Nattawat Lumtansawan" who is studying in Mahidol University Salaya
            Campus, Computer Network Major
      </b-card-text>
    </b-card>
  </div>
</template>

<script>
export default {
 
};
</script>

<style>
.qew {
  min-height: "50px";
  height: "250px";
  padding-right: "56.25%";
}
</style>
