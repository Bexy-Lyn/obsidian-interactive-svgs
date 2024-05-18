import { MarkdownPostProcessorContext, Plugin } from "obsidian";

export default class InteractiveSvgPlugin extends Plugin {
	// Add a property to store references to event listeners
	private linkEventListeners: Map<Element, (event: MouseEvent) => void> =
		new Map();

	async onload() {
		this.registerMarkdownPostProcessor(
			(element: HTMLElement, context: MarkdownPostProcessorContext) => {
				const svgs = element.querySelectorAll("svg");
				svgs.forEach((svg) => {
					this.processSvg(svg);
				});
			}
		);
	}

	processSvg(svgElement: SVGElement) {
		const textElements = svgElement.querySelectorAll("text");
		textElements.forEach((text) => {
			const content = text.innerHTML;
			if (content) {
				const regex = /\[\[(.*?)\]\]/g; // Regex to find [[link]] or [[link|alias]]
				text.innerHTML = content.replace(regex, (match, linkText) => {
					const parts = linkText.split("|");
					const link = parts[0];
					const alias = parts[1] || link;
					return `<a data-href="${link}" class="internal-link" style="text-decoration: none">${alias}</a>`;
				});
			}
		});
		svgElement
			.querySelectorAll("a.internal-link")
			.forEach((linkElement) => {
				const listener = (event: MouseEvent) => {
					const href = linkElement.getAttribute("data-href");
					if (href) {
						this.app.workspace.openLinkText(href, "", false);
						event.preventDefault();
					}
				};
				linkElement.addEventListener("click", listener);
				this.linkEventListeners.set(linkElement, listener); // Store the listener reference
			});
	}

	onunload() {
		this.linkEventListeners.forEach((listener, element) => {
			element.removeEventListener("click", listener);
		});
		this.linkEventListeners.clear(); // Clear the map to free up memory
	}
}
