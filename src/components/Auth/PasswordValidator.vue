<template>
    <div>
        <ul>
            <li :class="{ valid: hasMinLength }">
                <span v-if="hasMinLength"><i class="pi pi-check-circle"></i></span>
                <span v-else><i class="pi pi-times-circle"></i></span>
                <p>Contains at least 6 characters</p>
            </li>
            <li :class="{ valid: hasUpperCase }">
                <span v-if="hasUpperCase"><i class="pi pi-check-circle"></i></span>
                <span v-else><i class="pi pi-times-circle"></i></span>
                <p>Contains at least 1 uppercase character</p>
            </li>
            <li :class="{ valid: hasLowerCase }">
                <span v-if="hasLowerCase"><i class="pi pi-check-circle"></i></span>
                <span v-else><i class="pi pi-times-circle"></i></span>
                <p>Contains at least 1 lowercase character</p>
            </li>
            <li :class="{ valid: hasNumber }">
                <span v-if="hasNumber"><i class="pi pi-check-circle"></i></span>
                <span v-else><i class="pi pi-times-circle"></i></span>
                <p>Contains at least 1 number</p>
            </li>
            <li :class="{ valid: hasSpecialChar }">
                <span v-if="hasSpecialChar"><i class="pi pi-check-circle"></i></span>
                <span v-else><i class="pi pi-times-circle"></i></span>
                <p>Contains at least 1 special character</p>
            </li>
        </ul>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  password: {
    type: String,
    default: ''
  }
});

const hasMinLength = computed(() => props.password.length >= 6);
const hasUpperCase = computed(() => /[A-Z]/.test(props.password));
const hasLowerCase = computed(() => /[a-z]/.test(props.password));
const hasNumber = computed(() => /[0-9]/.test(props.password));
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(props.password));
</script>

<style scoped>
div {
    margin: 1rem 0;
}


ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

li.valid {
  color: var(--color-main-dark);
}

li:not(.valid) {
  color: rgb(172, 37, 37);
}

p {
    margin: 0 1rem;
}
</style>