// Cache DOM queries at initialization
const DOM = {
  ovals: document.querySelectorAll(".logo-wrapper"),
  ovalsImages: document.querySelectorAll(".logo-wrapper img"),
  maskHole: document.querySelector(".mask-hole"),
  mask: document.querySelector(".mask"),
};

const contentContainer = document.querySelector(".content-container");
let progress = 0;
const animationDuration = 7000;
const typingSpeed = 30;
let startTime = null;
let animationFrame;
const convergenceStart = 0.6;
const maskFadeStart = 0.5;
const ovalFadeOutDuration = 500;
const firstTypePause = 500;

// Easing functions
function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

async function typeContent() {
  contentContainer.style.opacity = "1";
  contentContainer.classList.add("visible");

  const textWrapper = contentContainer.querySelector(".content-text-wrapper");
  if (!textWrapper) return;

  // Handle H1 typing
  const h1 = textWrapper.querySelector("h1");
  const h1Text = h1.textContent;
  h1.textContent = "";
  h1.style.opacity = "1";

  const h1TypedContainer = document.createElement("span");
  h1.appendChild(h1TypedContainer);

  // Create and await h1 typing animation
  await new Promise((resolve) => {
    new Typed(h1TypedContainer, {
      strings: [h1Text],
      typeSpeed: 30,
      showCursor: true,
      cursorChar: "",
      startDelay: 1000,
      contentType: "text",
      cursorClassName: "typed-cursor--h1",
      onComplete: (self) => {
        if (self.cursor) {
          self.cursor.style.width = "0";
          self.cursor.style.minWidth = "0";
          self.cursor.style.maxWidth = "0";
          gsap.to(self.cursor, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
              if (self.cursor) {
                self.cursor.style.visibility = "hidden";
              }
              resolve();
            },
          });
        } else {
          resolve();
        }
      },
    });
  });

  await new Promise((resolve) => setTimeout(resolve, firstTypePause));

  // Show subtitle container
  const subtitle = textWrapper.querySelector(".subtitle");
  subtitle.style.opacity = "1";

  // Show the pill after all typing is complete
  const pill = contentContainer.querySelector(".pill");
  if (pill) {
    setTimeout(() => {
      pill.style.visibility = "visible";
      pill.classList.add("visible");
    }, 2000);
  }

  // Updated to include persona-button
  const privacyPolicyButton = document.querySelector(".privacy-policy-button");
  const personaButton = document.querySelector(".persona-button");
  const emailButton = document.querySelector(".email");
  const careersLink = document.querySelector(".careers-link");

  // Collect all potential elements
  const elementsToAnimate = [privacyPolicyButton, personaButton, emailButton, careersLink].filter(el => el);

  if (elementsToAnimate.length > 0) {
    // Set initial states
    gsap.set(elementsToAnimate, {
      opacity: 0,
      y: 10,
      visibility: "visible",
    });

    setTimeout(() => {
      gsap.to(elementsToAnimate, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        onStart: () => {
          if (privacyPolicyButton) privacyPolicyButton.classList.add("visible");
          if (personaButton) personaButton.classList.add("visible");
        },
      });
    }, 2000);
  }
}

function animate(currentTime) {
  if (!startTime) startTime = currentTime;
  const elapsed = currentTime - startTime;
  progress = Math.min(elapsed / animationDuration, 1);
  const easedProgress = easeInOutQuint(progress);

  // Handle mask hole animation
  const holeWidth = Math.min(100, window.innerWidth * 0.8) * easedProgress;
  const holeHeight = Math.min(60, window.innerHeight * 0.8) * easedProgress;
  DOM.maskHole.style.width = `${holeWidth}vh`;
  DOM.maskHole.style.height = `${holeHeight}vh`;
  DOM.maskHole.style.filter = `blur(${80 + 40 * easedProgress}px)`;

  // Handle mask fade
  if (progress >= maskFadeStart) {
    const maskFadeProgress = (progress - maskFadeStart) / (1 - maskFadeStart);
    DOM.mask.style.opacity = 1 - easeInOutQuint(maskFadeProgress);
  }

  // Calculate responsive dimensions once
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const ovalSize = viewportWidth < viewportHeight ? "95vw" : "95vh";
  const oHeight = `calc(${ovalSize} * 0.6)`;

  // Calculate convergence values once
  let convergenceProgress = 0;
  const isConverging = progress >= convergenceStart;
  if (isConverging) {
    convergenceProgress = (progress - convergenceStart) / (1 - convergenceStart);
  }

  // Handle oval animations
  DOM.ovals.forEach((oval, index) => {
    const offset = (index * 2 * Math.PI) / 3;
    const rotateX = Math.sin(offset);
    const rotateY = Math.cos(offset);

    const startScaleMultiplier = [0.3, 0.6, 1.0][index];
    let scaleMultiplier = startScaleMultiplier;

    if (isConverging) {
      scaleMultiplier = lerp(startScaleMultiplier, 1.0, easeInOutQuint(convergenceProgress));
    }

    const currentScale = easedProgress * scaleMultiplier;

    // Apply transforms
    oval.style.width = ovalSize;
    oval.style.height = oHeight;
    oval.style.transform = `
      translate3d(-50%, -50%, 0)
      rotate3d(${rotateX}, ${rotateY}, 0.5, ${-360 * (1 - easedProgress)}deg)
      scale3d(${currentScale}, ${currentScale}, 1)
    `;

    // Set opacity
    oval.style.opacity = index === 2 ? "1" : index === 1 ? "0.6" : "0.3";
    DOM.ovalsImages[index].style.opacity = "1";
  });

  // Handle convergence effects
  if (isConverging && convergenceProgress > 0.5) {
    document.querySelectorAll(".logo-element").forEach((element) => {
      element.classList.add("visible");
    });

    if (convergenceProgress >= 1 && !window.logoScaled) {
      window.logoScaled = true;
      const allOvals = document.querySelectorAll("#logo1, #logo2, #logo3");
      allOvals.forEach((oval) => {
        oval.style.transition = `opacity ${ovalFadeOutDuration}ms ease, filter ${ovalFadeOutDuration}ms ease`;
        oval.style.filter = "none";
      });
      setTimeout(fadeOutSecondSection, ovalFadeOutDuration);
    }
  }

  // Apply section holder heights
  document.querySelectorAll(".section-holder").forEach((holder) => {
    holder.style.height = oHeight;
  });

  if (progress < 1) {
    animationFrame = requestAnimationFrame(animate);
  }
}
function fadeOutSecondSection() {
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set("#section-holder", { display: "none" });
      gsap.set(".complete-logo-wrapper", {
        opacity: 0,
        display: "block",
      });

      gsap.to(".complete-logo-wrapper", {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => typeContent(),
      });
    },
  });

  gsap.set(".logo-wrapper img", {
    clearProps: "filter",
  });

  tl.to("#logo1, #logo2", {
    opacity: 0,
    filter: "drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
    duration: 0.25,
    ease: "power2.inOut",
  })
    .to(
      "#logo3",
      {
        opacity: 0,
        filter: "drop-shadow(0 0 0px rgba(255, 255, 255, 0))",
        duration: 0.5,
        ease: "power2.inOut",
      },
      "-=0.3"
    )
    .to(
      "#section-holder",
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
      },
      "-=0.2"
    );
}


// FORM VALIDATION

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function initializeApplicationForm() {
  const pill = document.querySelector(".pill");
  const form = document.querySelector(".application-form");
  const thankYou = document.querySelector(".thank-you");
  const emailInput = form.querySelector('input[type="email"]');
  const nameInput = form.querySelector('input[type="text"]');
  const textWrapper = document.querySelector(".content-text-wrapper");

  // Add required attribute to inputs
  emailInput.setAttribute("required", "true");
  nameInput.setAttribute("required", "true");

  // Set initial states
  gsap.set(form, {
    display: "none",
    opacity: 0,
    height: 0,
  });

  pill.addEventListener("click", () => {
    const tl = gsap.timeline();

    tl.to(pill, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        pill.style.display = "none";
        form.style.display = "flex";
      },
    }).to(form, {
      opacity: 1,
      height: "auto",
      duration: 0.5,
      ease: "power2.out",
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();

    if (!name || !validateEmail(email)) {
      if (!name) nameInput.style.borderColor = "rgb(255, 80, 80)";
      if (!validateEmail(email)) emailInput.style.borderColor = "rgb(255, 80, 80)";
      return;
    }

    try {
      const response = await fetch("https://app.joinaurora.co/api/v1/alpha-access/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
          timestamp: new Date().toISOString(),
        }),
      });

      const tl = gsap.timeline();

      tl.to(form, {
        opacity: 0,
        duration: 0.3,
        pointerEvents: "none",
        onComplete: () => {
          thankYou.style.display = "block";
        },
      })
        .to(textWrapper, {
          y: 0,
          duration: 0.5,
          ease: "power2.inOut",
        })
        .to(thankYou, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
    } catch (error) {
      console.error("Error submitting application:", error);
      // Use same animation for error case
      const tl = gsap.timeline();

      tl.to(form, {
        opacity: 0,
        duration: 0.3,
        pointerEvents: "none",
        onComplete: () => {
          thankYou.style.display = "block";
        },
      })
        .to(textWrapper, {
          y: 0,
          duration: 0.5,
          ease: "power2.inOut",
        })
        .to(thankYou, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
        });
    }
  });

  // Input validation reset
  emailInput.addEventListener("input", () => {
    emailInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
  });

  nameInput.addEventListener("input", () => {
    nameInput.style.borderColor = "rgba(255, 255, 255, 0.3)";
  });
}

// Add validateEmail function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Scroll Animation Observer
function initializeScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  document.querySelectorAll(".reveal-on-scroll").forEach((element) => {
    observer.observe(element);
  });
}

// Start animation when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  requestAnimationFrame(animate);
  initializeApplicationForm();
  initializeScrollAnimations(); // Initialize scroll animations
});

// Also start animation immediately in case the document is already loaded
if (document.readyState === "complete") {
  requestAnimationFrame(animate);
}
