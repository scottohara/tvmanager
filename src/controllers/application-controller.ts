import type {
	NavButtonEventHandler,
	Notice,
	View,
	ViewControllerArgs,
	ViewControllerSet,
} from "~/controllers";
import AboutController from "~/controllers/about-controller";
import EpisodeController from "~/controllers/episode-controller";
import EpisodesController from "~/controllers/episodes-controller";
import Login from "~/models/login-model";
import LoginController from "~/controllers/login-controller";
import ProgramController from "~/controllers/program-controller";
import ProgramsController from "~/controllers/programs-controller";
import ReportController from "~/controllers/report-controller";
import ScheduleController from "~/controllers/schedule-controller";
import SeriesController from "~/controllers/series-controller";
import SeriesListController from "~/controllers/seriesList-controller";
import SettingsController from "~/controllers/settings-controller";
import UnscheduledController from "~/controllers/unscheduled-controller";
import window from "~/components/window";

export default class ApplicationController {
	private static singletonInstance?: ApplicationController;

	public viewStack: View[] = [];

	private viewControllers!: ViewControllerSet;

	public constructor() {
		// App controller is a singleton, so if an instance already exists, return it
		if (undefined !== ApplicationController.singletonInstance) {
			return ApplicationController.singletonInstance;
		}

		// No existing instance, so make this instance the singleton
		ApplicationController.singletonInstance = this;

		return this;
	}

	private get currentView(): View {
		return this.viewStack[this.viewStack.length - 1];
	}

	// DOM selectors
	private get header(): HTMLDivElement {
		return document.querySelector("#footer") as HTMLDivElement;
	}

	private get headerLeftButton(): HTMLAnchorElement {
		return document.querySelector("#headerLeftButton") as HTMLAnchorElement;
	}

	private get headerLabel(): HTMLHeadingElement {
		return document.querySelector("#headerLabel") as HTMLHeadingElement;
	}

	private get headerRightButton(): HTMLAnchorElement {
		return document.querySelector("#headerRightButton") as HTMLAnchorElement;
	}

	private get nowLoading(): HTMLDivElement {
		return document.querySelector("#nowLoading") as HTMLDivElement;
	}

	private get content(): HTMLDivElement {
		return document.querySelector("#content") as HTMLDivElement;
	}

	private get footer(): HTMLDivElement {
		return document.querySelector("#footer") as HTMLDivElement;
	}

	private get footerLeftButton(): HTMLAnchorElement {
		return document.querySelector("#footerLeftButton") as HTMLAnchorElement;
	}

	private get footerLabel(): HTMLElement {
		return document.querySelector("#footerLabel") as HTMLElement;
	}

	private get footerRightButton(): HTMLAnchorElement {
		return document.querySelector("#footerRightButton") as HTMLAnchorElement;
	}

	private get notices(): HTMLDivElement {
		return document.querySelector("#notices") as HTMLDivElement;
	}

	public async start(): Promise<void> {
		// Populate an object with all of the view controllers, so that they can be referenced later dynamically by name
		this.viewControllers = {
			about: AboutController,
			episode: EpisodeController,
			episodes: EpisodesController,
			login: LoginController,
			program: ProgramController,
			programs: ProgramsController,
			report: ReportController,
			schedule: ScheduleController,
			series: SeriesController,
			seriesList: SeriesListController,
			settings: SettingsController,
			unscheduled: UnscheduledController,
		};

		// Display the schedule view if authenticated, otherwise the login view
		await this.pushView(Login.isAuthenticated ? "schedule" : "login");
	}

	public async popView(args?: ViewControllerArgs): Promise<void> {
		// Clear the header/footer
		this.clearFooter();
		this.clearHeader();

		// Pop the view off the stack
		this.viewStack.pop();

		// Display the previous view, or schedule if none
		return 0 === this.viewStack.length
			? this.pushView("schedule")
			: this.show(this.viewPopped.bind(this), args, "pop");
	}

	public getScrollPosition(): void {
		this.currentView.scrollPos = (
			this.content.firstElementChild as HTMLElement
		).scrollTop;
	}

	public setScrollPosition(): void {
		// If the scroll position is -1, set it to the bottom element
		if (-1 === this.currentView.scrollPos) {
			this.currentView.scrollPos = (
				this.content.firstElementChild?.lastElementChild as HTMLElement
			).offsetTop;
		}

		// Scroll to the saved position
		(this.content.firstElementChild as HTMLElement).scrollTop =
			this.currentView.scrollPos;
	}

	public setFooter(): void {
		// Only proceed if the view controller specified a footer
		if (undefined !== this.currentView.controller.footer) {
			// If the view controller specified a left-hand button, set it up
			if (undefined !== this.currentView.controller.footer.leftButton) {
				// Bind the event handler for the button
				if (
					undefined !==
					this.currentView.controller.footer.leftButton.eventHandler
				) {
					this.footerLeftButton.addEventListener(
						"click",
						this.currentView.controller.footer.leftButton.eventHandler,
					);
				}

				// Style the button
				this.footerLeftButton.className = "";
				this.footerLeftButton.classList.add("button", "footer", "left");

				if (undefined !== this.currentView.controller.footer.leftButton.style) {
					this.footerLeftButton.classList.add(
						this.currentView.controller.footer.leftButton.style,
					);
				}

				// Set the button label
				this.footerLeftButton.textContent =
					this.currentView.controller.footer.leftButton.label;

				// Show the button
				this.footerLeftButton.style.display = "inline";
			}

			// If the view controller specified a footer label, set it up
			if (undefined !== this.currentView.controller.footer.label) {
				this.footerLabel.textContent = this.currentView.controller.footer.label;
			}

			// Show the footer label
			this.footerLabel.style.display = "block";

			// If the view controller specified a right-hand button, set it up
			if (undefined !== this.currentView.controller.footer.rightButton) {
				// Bind the event handler for the button
				if (
					undefined !==
					this.currentView.controller.footer.rightButton.eventHandler
				) {
					this.footerRightButton.addEventListener(
						"click",
						this.currentView.controller.footer.rightButton.eventHandler,
					);
				}

				// Style the button
				this.footerRightButton.className = "";
				this.footerRightButton.classList.add("button", "footer", "right");

				if (
					undefined !== this.currentView.controller.footer.rightButton.style
				) {
					this.footerRightButton.classList.add(
						this.currentView.controller.footer.rightButton.style,
					);
				}

				// Set the button label
				this.footerRightButton.textContent =
					this.currentView.controller.footer.rightButton.label;

				// Show the button
				this.footerRightButton.style.display = "inline";
			}

			// Update the content height to accommodate the footer
			this.setContentHeight();
		}
	}

	public async pushView(
		view: string,
		args?: ViewControllerArgs,
	): Promise<void> {
		// If a current view is displayed, save the current scroll position and clear the existing header/footer
		if (this.viewStack.length > 0) {
			this.getScrollPosition();
			this.clearFooter();
			this.clearHeader();
		}

		// Push the view onto the stack and instantiate the controller with the specified arguments
		this.viewStack.push({
			controller: new this.viewControllers[view](args),
			scrollPos: 0,
		});

		// Display the view
		return this.show(this.viewPushed.bind(this));
	}

	public showNotice(notice: Notice): void {
		// Create a div for the new notice
		const noticeContainer = document.createElement("div"),
			noticeLeftButton = document.createElement("a"),
			noticeLabel = document.createElement("p");

		noticeContainer.classList.add("notice");
		noticeLabel.innerHTML = notice.label;
		noticeContainer.append(noticeLeftButton, noticeLabel);

		noticeLeftButton.addEventListener(
			"click",
			(): void => this.hideNotice(noticeContainer),
			{ once: true },
		);
		noticeLeftButton.classList.add("button", "left", "cautionButton");
		noticeLeftButton.textContent = "OK";

		// If the notice specified an identifier, set it
		if (undefined !== notice.id) {
			noticeLabel.id = notice.id;
		}

		// Animate the notice in via the View Transitions API
		const transition = document.startViewTransition((): void => {
			this.settleNotices();
			noticeContainer.classList.add("entering");
			this.notices.append(noticeContainer);
		});

		// Ignore skipped transitions
		transition.ready.catch((): void => undefined);
		transition.finished.catch((): void => undefined);
	}

	public clearFooter(): void {
		// Only proceed if the view controller specified a footer
		if (undefined !== this.currentView.controller.footer) {
			// If the view controller specified a left-hand button, unbind the event handler
			if (undefined !== this.currentView.controller.footer.leftButton) {
				this.footerLeftButton.removeEventListener(
					"click",
					this.currentView.controller.footer.leftButton
						.eventHandler as NavButtonEventHandler,
				);
			}

			// If the view controller specified a right-hand button, unbind the event handler
			if (undefined !== this.currentView.controller.footer.rightButton) {
				this.footerRightButton.removeEventListener(
					"click",
					this.currentView.controller.footer.rightButton
						.eventHandler as NavButtonEventHandler,
				);
			}
		}

		// Hide the buttons and footer label
		this.footerLeftButton.style.display = "none";
		this.footerLabel.textContent = "";
		this.footerLabel.style.display = "none";
		this.footerRightButton.style.display = "none";

		// Update the content height to reclaim the footer space
		this.setContentHeight();
	}

	private async viewPushed(): Promise<void> {
		// Call the view controller's setup method
		await this.currentView.controller.setup();
	}

	private async viewPopped(args: ViewControllerArgs): Promise<void> {
		// Call the view controller's activate method
		await this.currentView.controller.activate?.(args);
	}

	private async show(
		onSuccess: (_?: ViewControllerArgs) => Promise<void>,
		args?: ViewControllerArgs,
		direction: "pop" | "push" = "push",
	): Promise<void> {
		// Show the now loading indicator
		this.nowLoading.classList.add("loading");

		const transition = document.startViewTransition({
			update: async (): Promise<void> => {
				try {
					// Load the view template
					this.content.innerHTML = this.currentView.controller.view;

					// Call the success function, passing through the arguments
					await onSuccess(args);

					// Set the header (based on the configuration set by the view controller)
					this.setHeader();
				} finally {
					// Hide the now loading indicator before the NEW snapshot is captured
					this.nowLoading.classList.remove("loading");
				}
			},
			types: [direction],
		});

		// Ignore skipped transitions
		transition.ready.catch((): void => undefined);

		// Wait for the animation to finish, then notify the view controller
		try {
			await transition.finished;
		} catch (e: unknown) {
			// Ignore skipped transitions
			if (!(e instanceof DOMException) || "AbortError" !== e.name) {
				throw e as Error;
			}
		}
		this.currentView.controller.contentShown?.();
	}

	private setHeader(): void {
		// If the view controller specified a left-hand button, set it up
		if (undefined !== this.currentView.controller.header.leftButton) {
			// Bind the event handler for the button
			if (
				undefined !== this.currentView.controller.header.leftButton.eventHandler
			) {
				this.headerLeftButton.addEventListener(
					"click",
					this.currentView.controller.header.leftButton.eventHandler,
				);
			}

			// Style the button
			this.headerLeftButton.className = "";
			this.headerLeftButton.classList.add("button", "header", "left");

			if (undefined !== this.currentView.controller.header.leftButton.style) {
				this.headerLeftButton.classList.add(
					this.currentView.controller.header.leftButton.style,
				);
			}

			// Set the button label
			this.headerLeftButton.textContent =
				this.currentView.controller.header.leftButton.label;

			// Show the button
			this.headerLeftButton.style.display = "inline";
		}

		// If the view controller specified a header, set up the header label
		if (undefined !== this.currentView.controller.header.label) {
			// Set the header label
			this.headerLabel.textContent = this.currentView.controller.header.label;

			// Show the header label
			this.headerLabel.style.display = "block";
		}

		// If the view controller specified a right-hand button, set it up
		if (undefined !== this.currentView.controller.header.rightButton) {
			// Bind the event handler for the button
			if (
				undefined !==
				this.currentView.controller.header.rightButton.eventHandler
			) {
				this.headerRightButton.addEventListener(
					"click",
					this.currentView.controller.header.rightButton.eventHandler,
				);
			}

			// Style the button
			this.headerRightButton.className = "";
			this.headerRightButton.classList.add("button", "header", "right");

			if (undefined !== this.currentView.controller.header.rightButton.style) {
				this.headerRightButton.classList.add(
					this.currentView.controller.header.rightButton.style,
				);
			}

			// Set the button label
			this.headerRightButton.textContent =
				this.currentView.controller.header.rightButton.label;

			// Show the button
			this.headerRightButton.style.display = "inline";
		}

		// Update the content height to accommodate the header
		this.setContentHeight();
	}

	private clearHeader(): void {
		// If the view controller specified a left-hand button, unbind the event handler
		if (undefined !== this.currentView.controller.header.leftButton) {
			this.headerLeftButton.removeEventListener(
				"click",
				this.currentView.controller.header.leftButton
					.eventHandler as NavButtonEventHandler,
			);
		}

		// If the view controller specified a right-hand button, unbind the event handler
		if (undefined !== this.currentView.controller.header.rightButton) {
			this.headerRightButton.removeEventListener(
				"click",
				this.currentView.controller.header.rightButton
					.eventHandler as NavButtonEventHandler,
			);
		}

		// Hide the buttons and header label
		this.headerLeftButton.style.display = "none";
		this.headerLabel.style.display = "none";
		this.headerRightButton.style.display = "none";

		// Update the content height to reclaim the header space
		this.setContentHeight();
	}

	private setContentHeight(): void {
		// If the label wraps, its layout height will be larger than the container's layout height, so use the biggest value
		const headerHeight = Math.max(
				this.header.offsetHeight,
				this.headerLabel.offsetHeight,
			),
			footerHeight = Math.max(
				this.footer.offsetHeight,
				this.footerLabel.offsetHeight,
			),
			IOS_HOME_BAR_HEIGHT = 13;

		(this.content.firstElementChild as HTMLElement).style.height = `${
			window.innerHeight - headerHeight - footerHeight - IOS_HOME_BAR_HEIGHT
		}px`;
	}

	private hideNotice(notice: HTMLDivElement): void {
		notice.classList.add("leaving");
		const transition = document.startViewTransition({
			update: (): void => {
				notice.remove();
				this.settleNotices();
			},
			types: ["hide-notice"],
		});

		// Ignore skipped transitions
		transition.ready.catch((): void => undefined);
		transition.finished.catch((): void => undefined);
	}

	private settleNotices(): void {
		this.notices
			.querySelectorAll(".entering")
			.forEach((notice: Element): void => notice.classList.remove("entering"));
	}
}
