(async function () {
  NodeList.prototype.slice = [].slice;
  NodeList.prototype.map = [].map;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function get_links() {
    console.log("COLLECT ALL LINKS");
    const SLEEP_TIME = 1000;
    let all_links = [];
    let prev_links = [];
    let prev_scroll = 0;
    let max_try_to_scroll = 3;
    let scroll_retry_counter = 0;

    while (true) {
      let links = document
        .querySelectorAll(".v1Nh3.kIKUG._bz0w")
        .map((e) => e.querySelector("a").getAttribute("href"));

      let last = prev_links[prev_links.length - 1];
      let i = 0;
      for (i = 0; i < links.length; i++) {
        if (links[i] == last) break;
      }

      if (i == links.length) {
        i = 0;
      } else if (i == links.length - 1) {
        i = links.length;
      } else {
        i++;
      }
      links = links.slice(i);
      console.log(links);
      if (links.length) prev_links = links;
      all_links.push(...links);
      window.scrollTo(0, document.body.scrollHeight);
      console.log("SLEEP " + SLEEP_TIME + "ms");
      await sleep(SLEEP_TIME);
      if (prev_scroll == document.body.scrollHeight) {
        if (scroll_retry_counter == max_try_to_scroll) {
          break;
        }
        scroll_retry_counter++;
      } else {
        scroll_retry_counter = 0;
      }
      prev_scroll = document.body.scrollHeight;
    }
    return all_links;
  }

  async function handle_regular() {
    return {
      type: "img",
      link: document
        .querySelector(".ZyFrc .eLAPa .KL4Bh > img")
        .getAttribute("src"),
    };
  }

  async function handle_video() {
    return {
      type: "video",
      link: document
        .querySelector(".GRtmf.wymO0 > ._5wCQW > video")
        .getAttribute("src"),
    };
  }

  async function handle_kalash() {
    let links = [];
    let node_imgs = document.querySelectorAll(".ZyFrc .KL4Bh img");
    links.push(...node_imgs.map((e) => e.getAttribute("src")));

    while (true) {
      try {
        document.querySelector("._6CZji").click();
        await sleep(500);
        node_imgs = document.querySelectorAll(".ZyFrc .KL4Bh img");
        links.push(node_imgs[node_imgs.length - 1].getAttribute("src"));
      } catch (e) {
        break;
      }
    }

    links.pop();

    return {
      type: "img",
      links,
    };
  }

  async function handle_post() {
    const selectors = [
      "._6CZji",
      ".GRtmf.wymO0 > ._5wCQW > video",
      ".ZyFrc .eLAPa .KL4Bh > img",
    ];

    async function wait_selectors(selectors) {
      await sleep(100);
      while (true) {
        for (s of selectors) {
          try {
            if (document.querySelector(s)) return;
            //   if (document.querySelector(s)) return;
          } catch (error) {}
        }
        console.log("sleep 100");
        await sleep(100);
      }
    }

    await wait_selectors(selectors);

    let res;
    if (document.querySelector("._6CZji")) {
      res = await handle_kalash();
    } else if (document.querySelector(".GRtmf.wymO0 > ._5wCQW > video")) {
      res = await handle_video();
    } else if (document.querySelectorAll(".ZyFrc .eLAPa .KL4Bh > img")) {
      res = await handle_regular();
    }

    console.log(res);
    return res;
  }

  function write_out(data) {
    document.body.innerHTML = "";

    document.write(`mkdir posts-data && cd posts-data <br>`);
    let i = 0;
    for (const d of data) {
      i++;

      document.write(`echo download post ${i} <br>`);
      document.write(`mkdir post-${i} <br>`);

      if (d.links) {
        for (const l of d.links) {
          document.write(
            `curl "${l}" --silent --output ./post-${i}/$(uuidgen).png & <br>`
          );
        }
      } else if (d.link) {
        if (d.type == "img") {
          document.write(
            `curl "${d.link}" --silent --output ./post-${i}/$(uuidgen).png & <br>`
          );
        } else if (d.type == "video") {
          document.write(
            `curl "${d.link}" --silent --output ./post-${i}/$(uuidgen).mp4 & <br>`
          );
        }
      }
      document.write(`<br>`);
      if (i % 10 == 0) {
        document.write(`wait <br>`);
      }
    }
    document.write(`wait <br>`);
    document.write(`echo DONE, TOTAL ${data.length} POSTS DOWNLOADED<br>`);
  }

  async function get_posts_info(links) {
    let result = [];
    const scroll_step = 1000;
    let scroll_position = 0;
    window.scrollTo(0, scroll_position);
    await sleep(1000);

    for (let link of links) {
      try {
        document.querySelector(`a[href='${link}']`).click();
        let data = await handle_post();
        result.push(data);
      } catch (e) {
        console.log(e);
        console.log("WE CAN'T OPEN", link);
        document.querySelector(".NOTWr > .wpO6b").click();

        while (true) {
          console.log("SCROLL");
          window.scrollTo(0, scroll_position);
          scroll_position += scroll_step;
          await sleep(800);
          console.log("TRY AGAIN ", link);
          if (document.querySelector(`a[href='${link}']`)) break;
        }

        console.log("TRY AGAIN ", link);
        document.querySelector(`a[href='${link}']`).click();
        let data = await handle_post();
        result.push(data);
      }
    }
    console.log("DONE HERE");
    return result;
  }

  /////////////////////
  //   MAIN
  /////////////////////

  let links = await get_links();
  let posts_data = await get_posts_info(links);
  write_out(posts_data);
})();
