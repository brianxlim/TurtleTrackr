<template>
    <header class="navbar">
      <div class="logo">
        <img src="@/assets/turtles/spurredTortoise.png" style="height: 40px; width: auto;" alt="Turtle Logo" id = "turtleTrackr"/>
TurtleTrackr
    </div>
      <nav>
        <a href="#">Home</a>
        <a href="#">Family</a>
        <a href="#">History</a>
        <a href="#">Goals</a>
        <a href="#">Profile</a>
      </nav>
    </header>
</template>

<script>
export default {
  name: "NavBar"
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #3d5538;
  padding: 15px 30px;
  color: white;
}

.navbar a {
  color: white;
  margin: 0 10px;
  text-decoration: none;
}

#turtleTrackr {
  height: 40px;
  width: auto;
}
</style>
