export default function hexMD5(message = ""): string {
	return message.replace(/.*/u, "test-hash");
}
