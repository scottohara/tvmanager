export type PublicInterface<Class> = {
	[Member in keyof Class]: Class[Member]
};