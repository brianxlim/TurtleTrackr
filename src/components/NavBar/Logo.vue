<template>
    <div class="logo">
        <img src="@/assets/turtles/spurredTortoise.png" id="logo-turtle" alt="Turtle Logo"/>
        <p>TurtleTrackr</p>
    </div>
</template>

<script>
export default {
    name: "Logo"
}
</script>

<style scoped>
.logo {
    display: flex;
    flex-direction: row;
    align-items: center;
}

#logo-turtle {
    width: 5rem;
    height: 4rem;
}

p {
    font-family: var(--font-logo);
    font-weight: 500;
    font-size: 2rem;
    color: var(--color-main-light);
    padding: 0;
    margin: 0;
}
</style>