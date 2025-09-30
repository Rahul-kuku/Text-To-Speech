







function toggleFullscreen() {
    let board = document.getElementById("board");

    if (!document.fullscreenElement) {
        if (board.requestFullscreen) {
            board.requestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}




// ✅ Function to calculate reading duration based on text length
function calculateReadingDuration(text) {
    let words = text.split(/\s+/).length;
    let avgSpeed = 180; // Approximate words per minute for normal speech
    let duration = (words / avgSpeed) * 60; // Convert to seconds
    return duration;
}



let synth = window.speechSynthesis;
let isPlaying = false;
let isPaused = false;
let speech;
let words = [];
let seekBar = document.getElementById("seekBar");
let speechStartTime;
let totalDuration;
let currentIndex = 0;
let currentSpeed = 0.2;
let wasStopped = false; // Track if speech was stopped manually

function togglePlayPause(startFromIndex = null) {
    let textContainer = document.getElementById("textContainer");
    let button = document.getElementById("playPauseBtn");
    let text = textContainer.innerText.trim();

    if (text === "") return;

    // ✅ Ensure dictation resumes from the correct position
    if (startFromIndex !== null) {
        currentIndex = startFromIndex;
        wasStopped = false; // ✅ Reset stop flag when clicking on a word
    }

    // ✅ Resume if paused
    if (isPaused) {
        synth.resume();
        button.innerHTML = "⏸";
        isPaused = false;
        isPlaying = true;
        return;
    }

    // ✅ Stop dictation if playing
    if (isPlaying) {
        synth.cancel();
        isPlaying = false;
        isPaused = false;
        wasStopped = true; // ✅ Mark that it was manually stopped
        button.innerHTML = "▶";
        return;
    }

    synth.cancel(); // Stop any ongoing speech

    words = text.split(/\s+/);

    // ✅ If dictation was stopped, continue from the last position
    if (wasStopped && startFromIndex === null) {
        startFromIndex = currentIndex;
    }

    if (startFromIndex !== null) {
        currentIndex = startFromIndex;
    }

    if (currentIndex >= words.length) return;

    // ✅ Create speech object
    speech = new SpeechSynthesisUtterance(words.slice(currentIndex).join(" "));
    speech.voice = synth.getVoices()[0];
    speech.rate = currentSpeed;

    totalDuration = calculateReadingDuration(text);
    seekBar.max = totalDuration;
    speechStartTime = Date.now();

    // ✅ Highlight words & update seek bar
    speech.onboundary = function (event) {
        if (event.name === "word" && currentIndex < words.length) {
            highlightWord(currentIndex);
            updateSeekBar();
            currentIndex++;
        }
    };

    // ✅ Restart dictation properly when it ends
    speech.onend = function () {
        isPlaying = false;
        isPaused = false;
        wasStopped = false;
        currentIndex = 0; // ✅ Reset index so it restarts
        button.innerHTML = "▶";
    };

    synth.speak(speech);
    button.innerHTML = "⏸";
    isPlaying = true;
    isPaused = false;
}








// ✅ **Fix: Seek Bar Progress Sync**
function updateSeekBar() {
    if (!isPlaying) return;

    let elapsedTime = (Date.now() - speechStartTime) / 1000;
    let progress = (currentIndex / words.length) * totalDuration;

    seekBar.value = progress;
}

// Allow user to manually seek text
seekBar.addEventListener("input", function () {
    let newIndex = Math.floor((seekBar.value / totalDuration) * words.length);
    togglePlayPause(newIndex);
});

// Function to highlight the current word
// Function to highlight the current word and allow clicking
function highlightWord(index) {
    let textContainer = document.getElementById("textContainer");
    
    let text = words.map((word, i) =>
        i === index 
            ? `<span class="highlight clickable">${word}</span>`  // ✅ Highlighted word
            : `<span class="clickable">${word}</span>` // ✅ Other words clickable
    ).join(" ");
    
    textContainer.innerHTML = text;

    // Scroll to the highlighted word
    let highlightedWord = document.querySelector(".highlight");
    if (highlightedWord) {
        highlightedWord.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // ✅ Allow users to click on any word to start dictation from there
    document.querySelectorAll(".clickable").forEach((wordSpan, i) => {
        wordSpan.addEventListener("click", function () {
            togglePlayPause(i);
        });
    });
}


let hideTimer;

document.getElementById("board").addEventListener("mousemove", function () {
    showControls();
    resetHideTimer();
});

document.getElementById("board").addEventListener("mouseleave", function () {
    hideControls();
});

function showControls() {
    document.querySelector(".play-btn").style.opacity = "1";
    document.querySelector(".fullscreen-btn").style.opacity = "1";
    seekBar.style.opacity = "1";
    document.querySelector(".speed-container").style.opacity = "1"; // ✅ Show Speed Button
}

function hideControls() {
    document.querySelector(".play-btn").style.opacity = "0";
    document.querySelector(".fullscreen-btn").style.opacity = "0";
    document.getElementById("seekBar").style.opacity = "0";
    document.querySelector(".speed-container").style.opacity = "0"; // ✅ Hide Speed Button
}

function resetHideTimer() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideControls, 5000);
}

// Fix for removing background when pasting text
document.getElementById("textContainer").addEventListener("paste", function (event) {
    event.preventDefault();

    let text = (event.clipboardData || window.clipboardData).getData("text");
    document.execCommand("insertText", false, text);
});

let textContainer = document.getElementById("textContainer");

function checkPlaceholder() {
    if (textContainer.innerText.trim() === "") {
        textContainer.classList.add("placeholder");
        textContainer.innerText = "Type or paste your text here...";
    }
}

textContainer.addEventListener("focus", function () {
    if (textContainer.classList.contains("placeholder")) {
        textContainer.classList.remove("placeholder");
        textContainer.innerText = "";
    }
});

textContainer.addEventListener("blur", checkPlaceholder);

checkPlaceholder();

// ✅ **Fix: Speed Selection Works Without Stopping Speech**
let speedButton = document.querySelector(".speed-btn");
let speedDropdown = document.querySelector(".speed-dropdown");
let speedOptions = document.querySelectorAll(".speed-dropdown li");

speedButton.addEventListener("click", function (event) {
    event.stopPropagation();
    speedDropdown.parentElement.classList.toggle("active");
});

document.addEventListener("click", function () {
    speedDropdown.parentElement.classList.remove("active");
});

speedOptions.forEach(option => {
    option.addEventListener("click", function () {
        let newSpeed = parseFloat(option.getAttribute("data-speed")) * 0.2; // Reduce all speeds by 20%

        if (newSpeed !== currentSpeed) {
            currentSpeed = newSpeed;
            updateSpeedUI(this);

            // ✅ If dictation is playing, restart with new speed
            if (isPlaying) {
                let lastWordIndex = currentIndex; // Save last spoken word index
                synth.cancel(); // Stop current speech
                
                // ✅ Fix: If only 1-2 words left, restart from the beginning
                if (lastWordIndex >= words.length - 2) {
                    lastWordIndex = 0; // Restart from beginning if near the end
                }

                setTimeout(() => togglePlayPause(lastWordIndex), 100);
            }
        }
    });
});


// Update UI to Show Selected Speed
function updateSpeedUI(selectedOption) {
    speedOptions.forEach(option => {
        option.classList.remove("selected");
        option.innerHTML = option.getAttribute("data-speed") + "x";
    });

    selectedOption.classList.add("selected");
    selectedOption.innerHTML = `${selectedOption.getAttribute("data-speed")}x ✔`;

}




const textOptions = [
    "Your Personal AI Reader – Transforming Text into Speech Instantly!",
    "Click Any Word to Start Dictation Instantly!", // Option 2
    "Listen, Learn, and Improve with Seamless Speech!",       // Option 4
    "Transform Text into Voice with One Click!",             // Option 6
    "Your Smartboard for Audio Learning Awaits!"             // Option 8
];

let textContainerr = document.getElementById("textAnimation"); // Your target element
let textIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100; // Typing speed (ms)
let erasingSpeed = 50; // Erasing speed (ms)
let pauseBetween = 2000; // Pause after full text appears

function typeText() {
    let currentText = textOptions[textIndex];

    if (isDeleting) {
        textContainerr.innerHTML = currentText.substring(0, charIndex--);
    } else {
        textContainerr.innerHTML = currentText.substring(0, charIndex++);
    }

    if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        setTimeout(typeText, pauseBetween); // Hold before erasing
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % textOptions.length; // Move to next phrase
        setTimeout(typeText, typingSpeed);
    } else {
        setTimeout(typeText, isDeleting ? erasingSpeed : typingSpeed);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(typeText, 1000); // Start after page loads
});


const numStars = 150; // Number of stars
const starsContainer = document.querySelector(".stars");
const meteorsContainer = document.querySelector(".meteors");

// 🌟 Create Stars
for (let i = 0; i < numStars; i++) {
    let star = document.createElement("div");
    star.className = "star";
    star.style.top = `${Math.random() * 100}vh`;
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`; // Different twinkle speeds
    starsContainer.appendChild(star);
}

// 🌠 Create Random Meteors
function createMeteor() {
    let meteor = document.createElement("div");
    meteor.className = "meteor";
    meteor.style.top = `${Math.random() * 50}vh`;
    meteor.style.left = `${Math.random() * 100}vw`;
    meteor.style.animationDuration = `${Math.random() * 2 + 1}s`;

    meteorsContainer.appendChild(meteor);

    // Remove meteor after animation
    setTimeout(() => meteor.remove(), 2000);
}

// 🌠 Generate Meteors Randomly Every Few Seconds
setInterval(createMeteor, 3000);



