import { writable } from 'svelte/store';

export const jsonData = writable([]);
export const carts = writable([]);
export let visibility = writable("hidden");
export let logged = writable(false);
export let show = writable(false);
export const cartData = writable({});
export let cartCount = writable(0);
export let user = writable({});
export let loginData = writable({});
export let progress = writable(0);