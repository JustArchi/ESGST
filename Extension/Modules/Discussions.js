_MODULES.push({
    endless: true,
    id: `discussions`,
    load: discussions
  });
  
  function discussions() {
    esgst.endlessFeatures.push(discussions_load);
  }

  async function discussions_load(context, main, source, endless) {
    let discussions = await discussions_get(context, main, endless);
    if (!discussions.length) return;
    if (main) {
      for (let i = discussions.length - 1; i > -1; --i) {
        discussions[i].sortIndex = esgst.mainDiscussions.length;
        esgst.mainDiscussions.push(discussions[i]);
      }
    } else {
      for (let i = discussions.length - 1; i > -1; --i) {
        discussions[i].sortIndex = esgst.popupDiscussions.length;
        esgst.popupDiscussions.push(discussions[i]);
      }
    }
    if (!main || esgst.discussionsPath) {
      if (esgst.df && esgst.df.filteredCount && esgst[`df_enable${esgst.df.type}`]) {
        filters_filter(esgst.df, false, endless);
      }
      if (esgst.ds && esgst.ds_auto) {
        sortContent(esgst.mainDiscussions, null, esgst.ds_option);
      }
    }
    if (esgst.mm_enableDiscussions && esgst.mm_enable) {
      esgst.mm_enable(esgst[main ? `mainDiscussions` : `popupDiscussions`], `Discussions`);
    }
  }

  async function discussions_get(context, main, endless) {
    let discussions = [];
    let elements = context.querySelectorAll(`${endless ? `.esgst-es-page-${endless} .table__row-outer-wrap, .esgst-es-page-${endless}.table__row-outer-wrap` : `.table__row-outer-wrap`}`);
    for (let i = elements.length - 1; i > -1; --i) {
      let discussion = await discussions_getInfo(elements[i], main);
      if (!discussion) continue;
      discussions.push(discussion);
    }
    if (context === document && main && esgst.discussionPath) {
      let discussion = {
        code: location.pathname.match(/^\/discussion\/(.+?)\//)[1],
        heading: document.getElementsByClassName(`page__heading__breadcrumbs`)[0],
        headingContainer: document.getElementsByClassName(`page__heading`)[0]
      };
      discussion.title = discussion.heading.getElementsByTagName(`H1`)[0].textContent.trim();
      checkVersion(discussion);
      discussion.category = discussion.heading.firstElementChild.nextElementSibling.nextElementSibling.textContent;
      discussions.push(discussion);
    }
    discussions.forEach(discussion => {
      let savedDiscussion = esgst.discussions[discussion.code];
      if (esgst.codb && discussion.author === esgst.username && !discussion.heading.parentElement.getElementsByClassName(`esgst-codb-button`)[0]) {
        if (discussion.closed) {
          discussion.closed.remove();
          discussion.closed = true;
        }
        new Button(discussion.headingContainer.firstElementChild, `beforeBegin`, {
          callbacks: [codb_close.bind(null, discussion), null, codb_open.bind(null, discussion), null],
          className: `esgst-codb-button`,
          icons: [`fa-lock esgst-clickable`, `fa-circle-o-notch fa-spin`, `fa-lock esgst-clickable esgst-red`, `fa-circle-o-notch fa-spin`],
          id: `codb`,
          index: discussion.closed ? 2 : 0,
          titles: [`Close discussion`, `Closing discussion...`, `Open discussion`, `Opening discussion...`]
        });
      }
      if (esgst.df && esgst.df_s && !discussion.heading.parentElement.getElementsByClassName(`esgst-df-button`)[0]) {
        new Button(discussion.headingContainer.firstElementChild, `beforeBegin`, {
          callbacks: [df_hideDiscussion.bind(null, discussion, main), null, df_unhideDiscussion.bind(null, discussion, main), null],
          className: `esgst-df-button`,
          icons: [`fa-eye-slash esgst-clickable`, `fa-circle-o-notch fa-spin`, `fa-eye esgst-clickable`, `fa-circle-o-notch fa-spin`],
          id: `df_s`,
          index: savedDiscussion && savedDiscussion.hidden ? 2 : 0,
          titles: [`Hide discussion`, `Hiding discussion...`, `Unhide discussion`, `Unhiding discussion...`]
        });
      }
      if (esgst.dh && !discussion.heading.parentElement.getElementsByClassName(`esgst-dh-button`)[0]) {
        let context = main && esgst.discussionPath ? discussion.heading : discussion.outerWrap;
        let index = 0;
        if (savedDiscussion && savedDiscussion.highlighted) {
          dh_highlightDiscussion(discussion.code, context);
          if (esgst.dh_t && main && esgst.discussionsPath) {
            discussion.outerWrap.parentElement.insertBefore(discussion.outerWrap, discussion.outerWrap.parentElement.firstElementChild);
            discussion.isPinned = true;
          }
          index = 2;
        }
        discussion.dhButton = new Button(discussion.heading.parentElement, `afterBegin`, {
          callbacks: [dh_highlightDiscussion.bind(null, discussion.code, context, true), null, dh_unhighlightDiscussion.bind(null, discussion.code, context, true), null],
          className: `esgst-dh-button`,
          icons: [`fa-star-o esgst-clickable`, `fa-circle-o-notch fa-spin`, `fa-star esgst-clickable`, `fa-circle-o-notch fa-spin`],
          id: `dh`,
          index: index,
          titles: [`Click to highlight this discussion`, `Highlighting discussion...`, `Click to unhighlight this discussion`, `Unhighlighting discussion...`]
        });
      }
      if (esgst.pm && (esgst.pm_a || discussion.category === `Puzzles`)) {
        let context = main && esgst.discussionPath ? discussion.headingContainer : discussion.outerWrap;
        if (!context.getElementsByClassName(`esgst-pm-button`)[0]) {
          context.classList.add(`esgst-relative`);
          new Button(context, `afterBegin`, {
            callbacks: [pm_change.bind(null, discussion.code, `unsolved`), null, pm_change.bind(null, discussion.code, `in progress`), null, pm_change.bind(null, discussion.code, `solved`), null, pm_change.bind(null, discussion.code, `off`), null],
            className: `esgst-pm-button`,
            icons: [`fa-circle-o esgst-clickable esgst-grey`, `fa-circle-o-notch fa-spin`, `fa-times-circle esgst-clickable esgst-red`, `fa-circle-o-notch fa-spin`, `fa-exclamation-circle esgst-clickable esgst-orange`, `fa-circle-o-notch fa-spin`, `fa-check-circle esgst-clickable esgst-green`, `fa-circle-o-notch fa-spin`],
            id: `pm`,
            index: [`off`, ``, `unsolved`, ``, `in progress`, ``, `solved`].indexOf((savedDiscussion && savedDiscussion.status) || `off`),
            titles: [`Current status is 'off', click to change to 'unsolved'`, `Changing status...`, `Current status is 'unsolved', click to change to 'in progress'`, `Changing status...`, `Current status is 'in progress', click to change to 'solved'`, `Changing status...`, `Current status is 'solved', click to change to 'off'`, `Changing status...`]
          });
        }
      }
    });
    return discussions;
  }

  async function discussions_getInfo(context, main) {
    let match, discussion, savedUser, uf;
    if (context.closest(`.poll`)) return;
    discussion = {};
    discussion.outerWrap = context;
    discussion.innerWrap = discussion.outerWrap.getElementsByClassName(`table__row-inner-wrap`)[0];
    if (!discussion.innerWrap) return;
    discussion.avatarColumn = discussion.innerWrap.firstElementChild;
    if (!discussion.avatarColumn) return;
    discussion.avatar = discussion.avatarColumn.firstElementChild;
    if (!discussion.avatar) return;
    discussion.headingColumn = discussion.avatarColumn.nextElementSibling;
    discussion.headingContainer = discussion.headingColumn.firstElementChild;
    if (!discussion.headingContainer) return;
    discussion.closed = discussion.headingContainer.getElementsByClassName(`fa-lock`)[0];
    discussion.heading = discussion.headingContainer.lastElementChild;
    discussion.info = discussion.headingContainer.nextElementSibling;
    if (!discussion.heading) {
      return;
    }
    discussion.title = discussion.heading.textContent;
    discussion.url = discussion.heading.getAttribute(`href`);
    if (!discussion.url) {
      return;
    }
    match = discussion.url.match(/discussion\/(.+?)\//);
    if (!match) {
      return;
    }
    discussion.code = match[1];
    checkVersion(discussion);
    if (main && esgst.df && esgst.df_s && esgst.discussions[discussion.code] && esgst.discussions[discussion.code].hidden) {
      discussion.outerWrap.remove();
      return;
    }
    if (esgst.discussions[discussion.code]) {
      discussion.highlighted = esgst.discussions[discussion.code].highlighted;
      discussion.visited = esgst.discussions[discussion.code].visited;
    }
    discussion.categoryContainer = discussion.info.firstElementChild;
    if (discussion.headingColumn.nextElementSibling) {
      discussion.category = discussion.categoryContainer.textContent;
      discussion[discussion.category.replace(/\W/g, ``).replace(/^(.)/, (m, p1) => { return p1.toLowerCase(); })] = true;
    } else {
      discussion.category = ``;
    }
    discussion.createdContainer = discussion.categoryContainer.nextElementSibling;
    if (discussion.createdContainer) {
      discussion.createdTime = discussion.createdContainer.textContent;
      discussion.createdTimestamp = parseInt(discussion.createdContainer.getAttribute(`data-timestamp`)) * 1e3;
      if (esgst.giveawaysPath) {
        discussion.author = discussion.avatar.getAttribute(`href`).match(/\/user\/(.+)/)[1];
      } else {
        discussion.author = discussion.createdContainer.nextElementSibling.textContent;
      }
    }
    if (!discussion.author) return;
    discussion.authors = [discussion.author.toLowerCase()];
    discussion.created = discussion.author === esgst.username;
    discussion.poll = discussion.outerWrap.getElementsByClassName(`fa-align-left`)[0];
    discussion.commentsColumn = discussion.headingColumn.nextElementSibling || discussion.headingColumn.children[1];
    if (discussion.commentsColumn) {
      discussion.comments = parseInt(discussion.commentsColumn.firstElementChild.textContent.replace(/,/g, ``));
      if (esgst.giveawaysPath && esgst.adots && esgst.adots_index === 1 && esgst.ns) {
        discussion.commentsColumn.firstElementChild.textContent = discussion.commentsColumn.firstElementChild.textContent.replace(/\sComments/, ``);
      }
    }
    discussion.lastPost = discussion.outerWrap.getElementsByClassName(`table__column--last-comment`)[0];
    if (discussion.lastPost && discussion.lastPost.firstElementChild) {
      discussion.lastPostTime = discussion.lastPost.firstElementChild.firstElementChild;
      discussion.lastPostAuthor = discussion.lastPostTime.nextElementSibling;
      discussion.lastPostCode = discussion.lastPostAuthor.lastElementChild.getAttribute(`href`).match(/\/comment\/(.+)/)[1];
      discussion.lastPostAuthor = discussion.lastPostAuthor.firstElementChild.textContent;
      discussion.lastPostTime = discussion.lastPostTime.firstElementChild;
      discussion.lastPostTimestamp = discussion.lastPostTime.getAttribute(`data-timestamp`);
      discussion.lastPostTime = discussion.lastPostTime.textContent;
    }
    if (esgst.uf) {
      savedUser = await getUser(esgst.users, {
        username: discussion.author
      });
      if (savedUser) {
        uf = savedUser.uf;
        if (esgst.uf_d && savedUser.blacklisted && !uf) {
          if (!esgst.giveawaysPath) {
            uf_updateCount(discussion.outerWrap.parentElement.parentElement.nextElementSibling);
          }
          discussion.outerWrap.remove();
          return;
        } else if (uf && uf.discussions) {
          if (!esgst.giveawaysPath) {
            uf_updateCount(discussion.outerWrap.parentElement.parentElement.nextElementSibling);
          }
          discussion.outerWrap.remove();
          return;
        }
      }
    }
    return discussion;
  }
