export default function About() {
  return (
    <div className="bg-[#0f172a] min-h-screen text-white py-16">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-center mb-16 relative inline-block left-1/2 -translate-x-1/2">
          關於我們
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"></div>
        </h1>

        <div className="bg-[#1e293b] p-8 md:p-12 rounded-3xl border border-gray-800 space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">品牌故事</h2>
            <p>
              小豆倉點卡商城成立於 2026 年，致力於提供最便捷、最安全的數位娛樂點數購買服務。
              我們深知玩家在遊戲世界中對於即時儲值的渴望，因此打造了這個全方位的點數商城。
              無論是 Steam、Google Play、Apple Store 還是各大遊戲平台的專屬點數，您都能在這裡輕鬆找到。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">我們的使命</h2>
            <p>
              「輕鬆購點，就在小豆倉」不只是一句口號，更是我們的核心價值。
              我們不斷優化購物流程，提供多元的支付方式，並確保每一筆交易的安全與迅速。
              我們的目標是成為亞洲地區最值得信賴的數位點數發行與經銷平台。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">為什麼選擇我們？</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong className="text-white">官方授權：</strong> 所有點數卡皆為官方正規授權，來源安全可靠。</li>
              <li><strong className="text-white">即時發卡：</strong> 系統自動化處理，付款完成後即刻取得序號，無需等待。</li>
              <li><strong className="text-white">多元支付：</strong> 支援信用卡、超商代碼、電子支付等多種付款方式。</li>
              <li><strong className="text-white">專業客服：</strong> 提供完善的售後服務，解決您在購買過程中遇到的任何問題。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
