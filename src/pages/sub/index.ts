Page({
  go(e) {
    wx.navigateTo({
      url: e.target.dataset.url
    })
  },
})