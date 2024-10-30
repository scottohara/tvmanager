import type {
	NavButtonEventHandler,
	Notice,
	NoticeStack,
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

	private readonly noticeStack: NoticeStack = {
		height: -20,
		notice: [],
	};

	private viewControllers!: ViewControllerSet;

	public constructor() {
		// App controller is a singleton, so if an instance already exists, return it
		if (undefined !== ApplicationController.singletonInstance) {
			return ApplicationController.singletonInstance;
		}

		// No existing instance, so make this instance the singleton
		ApplicationController.singletonInstance = this;

		// Bind a handler for transition end events
		this.contentWrapper.addEventListener(
			"transitionend",
			this.contentShown.bind(this),
		);

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

	private get contentWrapper(): HTMLDivElement {
		return document.querySelector("#contentWrapper") as HTMLDivElement;
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

		if (Login.isAuthenticated) {
			// Display the schedule view
			await this.pushView("schedule");
		} else {
			// Display the login view (on next tick, to ensure the transitionend listener is ready)
			window.setTimeout(async (): Promise<void> => this.pushView("login"));
		}
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
			: this.show(this.viewPopped.bind(this), args);
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
			noticeLabel = document.createElement("p"),
			duration = 500;

		noticeContainer.classList.add("notice");
		noticeLabel.innerHTML = notice.label;
		noticeContainer.append(noticeLeftButton, noticeLabel);
		this.notices.append(noticeContainer);

		noticeLeftButton.addEventListener("click", (): void =>
			this.hideNotice(noticeContainer),
		);
		noticeLeftButton.classList.add("button", "left", "cautionButton");
		noticeLeftButton.textContent = "OK";

		// If the notice specified an identifier, set it
		if (undefined !== notice.id) {
			noticeLabel.id = notice.id;
		}

		// If there are currently no notices displayed, position the notices container just off screen (at the bottom) and make it visible
		if (!this.noticeStack.notice.length) {
			this.notices.style.top = `${window.innerHeight}px`;
			this.notices.style.visibility = "visible";
		}

		// Update the height of the notices stack to accommodate the new notice
		this.noticeStack.height -= noticeContainer.offsetHeight;

		// Push the notice onto the stack
		this.noticeStack.notice.push(noticeContainer);

		// Slide up the notices container to reveal the notice
		this.notices.animate(
			{
				transform: `translateY(${this.noticeStack.height}px)`,
			},
			{
				duration,
				easing: "ease",
				fill: "forwards",
			},
		).onfinish = this.noticesMoved.bind(this);
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
	): Promise<void> {
		// Show the now loading indicator
		this.nowLoading.classList.add("loading");

		// Load the view template
		this.content.innerHTML = this.currentView.controller.view;

		// Call the success function, passing through the arguments
		await onSuccess(args);

		// Slide in the new view from the right
		this.contentWrapper.classList.add("loading");

		// Set the header (based on the configuration set by the view controller)
		this.setHeader();
	}

	private contentShown(): void {
		if (this.contentWrapper.classList.contains("loading")) {
			this.contentWrapper.classList.remove("loading");
			this.contentWrapper.classList.add("loaded");
			this.nowLoading.classList.remove("loading");
		} else if (this.contentWrapper.classList.contains("loaded")) {
			this.contentWrapper.classList.remove("loaded");

			// Call the view controller's contentShown method
			this.currentView.controller.contentShown?.();
		}
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
		const NOTICE_ANIMATION_DURATION = 300,
			NOTICES_ANIMATION_DURATION = 500;

		// Update the height of the notices stack to reclaim the space for the notice
		this.noticeStack.height += notice.offsetHeight;

		// Slide the notice element off to the right
		notice.animate(
			{
				transform: "translateX(100%)",
			},
			{
				duration: NOTICE_ANIMATION_DURATION,
				easing: "ease-in",
				fill: "forwards",
			},
		).onfinish = (): void => {
			this.noticeStack.notice = this.noticeStack.notice.filter(
				(item: HTMLDivElement): boolean => item !== notice,
			);
			notice.remove();
		};

		// Slide down the notices container to the height of the notices stack
		this.notices.animate(
			{
				transform: `translateY(${this.noticeStack.height}px)`,
			},
			{
				duration: NOTICES_ANIMATION_DURATION,
				delay: NOTICE_ANIMATION_DURATION,
				easing: "ease",
				fill: "forwards",
			},
		).onfinish = this.noticesMoved.bind(this);
	}

	private noticesMoved(): void {
		// If there are no more notices visible, hide the notices container
		if (!this.noticeStack.notice.length) {
			this.notices.style.visibility = "hidden";
		}
	}
}
