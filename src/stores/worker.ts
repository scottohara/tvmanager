export default new Worker(new URL("~/stores/db", import.meta.url), {
	name: "db",
	type: "module",
});
