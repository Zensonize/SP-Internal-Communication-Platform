<template>
  <div>
    <b-card
    header="Full Stack Developer"
      class="pok"
      title="Pok"
      img-src="@/assets/imgs/pok.jpg"
      img-alt="Image"
      img-top
      v-lazy-load
    >
     <b-card-sub-title class="mb-2"> aka ProtonFaker, SNP</b-card-sub-title>
      <b-card-text >
        "Sunat Praphanwong" who is studying in Mahidol University Salaya Campus,
        Computer Science Major
      </b-card-text>
    </b-card>
  </div>
</template>

<script>
export default {};
</script>

<style>
.pok {
  min-height: "50px";
  height: "250px";
  padding-top: "56.25%";
}
</style>
