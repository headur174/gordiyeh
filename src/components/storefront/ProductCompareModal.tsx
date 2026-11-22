import React from 'react';
import { X, Scale, Trash2, Plus, Check, Minus, Star } from 'lucide-react';
import { CanonicalProduct, Currency } from '../../types';
import { formatCurrency } from '../../utils';

interface ProductCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: CanonicalProduct[];
  compareList: CanonicalProduct[];
  onRemoveFromCompare: (id: string) => void;
  onAddToCompare: (product: CanonicalProduct) => void;
  onSelectProductForDetails: (product: CanonicalProduct) => void;
  currency: Currency;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  isOpen,
  onClose,
  products,
  compareList,
  onRemoveFromCompare,
  onAddToCompare,
  onSelectProductForDetails,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-3xl w-full max-w-5xl shadow-2xl p-6 sm:p-8 text-[var(--text-main)] max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[var(--accent-primary)]" />
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">مقایسه‌ی محصول‌های گُردیه</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">مقایسه‌ی قیمت، کاربرد واقعی، محدودیت‌ها و شرایط تست هر محصول</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-2 rounded-full hover:bg-[var(--bg-card)] transition-colors"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {compareList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Scale className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-60" />
            <p className="text-xs text-[var(--text-main)] font-bold">هنوز هیچ محصولی برای مقایسه انتخاب نشده.</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              از بین محصول‌های زیر دو یا سه مورد را انتخاب کنید:
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto pt-2">
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => onAddToCompare(p)}
                  className="px-3.5 py-1.5 rounded-full bg-[var(--bg-main)] hover:bg-[var(--accent-soft)] text-[var(--text-main)] border border-[var(--border-color)] text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span className="truncate max-w-[180px]">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="p-3 bg-[var(--bg-main)] font-bold text-[var(--text-muted)] w-48">معیار مقایسه</th>
                  {compareList.map(p => (
                    <th key={p.id} className="p-3 bg-[var(--bg-main)] min-w-[220px] align-top">
                      <div className="flex flex-col items-center text-center space-y-2 relative">
                        <button
                          onClick={() => onRemoveFromCompare(p.id)}
                          className="absolute -top-1 -right-1 p-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                          title="حذف از مقایسه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <img
                          src={p.image}
                          alt={p.title}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-xl object-cover bg-[var(--bg-card)] border border-[var(--border-color)] cursor-pointer"
                          onClick={() => {
                            onSelectProductForDetails(p);
                            onClose();
                          }}
                        />
                        <span 
                          onClick={() => {
                            onSelectProductForDetails(p);
                            onClose();
                          }}
                          className="font-bold text-[var(--text-main)] hover:text-[var(--accent-primary)] cursor-pointer line-clamp-2"
                        >
                          {p.title}
                        </span>
                        <div className="text-[var(--accent-primary)] tabular-nums font-bold text-[13px]">
                          {formatCurrency(p.retailPrice, currency)}
                        </div>
                      </div>
                    </th>
                  ))}
                  {compareList.length < 3 && (
                    <th className="p-3 bg-[var(--bg-main)]/60 min-w-[160px] align-middle text-center border-dashed border-2 border-[var(--border-color)] rounded-xl">
                      <div className="space-y-2">
                        <span className="text-xs text-[var(--text-muted)] block">افزودن محصول دیگر</span>
                        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                          {products
                            .filter(p => !compareList.some(cp => cp.id === p.id))
                            .map(p => (
                              <button
                                key={p.id}
                                onClick={() => onAddToCompare(p)}
                                className="text-right p-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)] border border-[var(--border-color)] text-[11px] text-[var(--text-main)] truncate transition-colors"
                              >
                                + {p.title}
                              </button>
                            ))}
                        </div>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                <tr>
                  <td className="p-3 font-semibold text-[var(--text-muted)] bg-[var(--bg-main)]/70">دسته و برند</td>
                  {compareList.map(p => (
                    <td key={p.id} className="p-3 font-bold text-[var(--text-main)] text-center">
                      {p.category} • {p.brandFa || p.brand || 'گُردیه'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--text-secondary)] bg-[var(--bg-main)]/70">ویژگی‌های اصلی</td>
                  {compareList.map(p => (
                    <td key={p.id} className="p-3 text-[var(--text-secondary)] text-right text-xs leading-[1.8] align-top">
                      {p.keyFeatures && p.keyFeatures.length > 0 ? p.keyFeatures.slice(0, 3).join(' • ') : 'ثبت‌شده در صفحه‌ی محصول'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--text-secondary)] bg-[var(--bg-main)]/70">برای چه کسی مناسبه؟</td>
                  {compareList.map(p => (
                    <td key={p.id} className="p-3 text-emerald-700 dark:text-emerald-400 text-right text-xs leading-[1.8] align-top">
                      {p.suitableFor || 'ثبت‌شده در صفحه‌ی محصول'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-medium text-[var(--text-secondary)] bg-[var(--bg-main)]/70">برای چه کسی مناسب نیست؟</td>
                  {compareList.map(p => (
                    <td key={p.id} className="p-3 text-rose-700 dark:text-rose-400 text-right text-xs leading-[1.8] align-top">
                      {p.notSuitableFor || 'ثبت‌شده در صفحه‌ی محصول'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--text-muted)] bg-[var(--bg-main)]/70">موجودی و ارسال</td>
                  {compareList.map(p => {
                    const activeOffer = p.supplierOffers.find(o => o.id === p.selectedOfferId) || p.supplierOffers[0];
                    return (
                      <td key={p.id} className="p-3 text-center">
                        <span className="text-[var(--text-main)] font-bold block">
                          {(activeOffer?.stock || 0) > 0 ? `${activeOffer?.stock} عدد موجود` : 'ناموجود'}
                        </span>
                        <span className="text-[var(--text-muted)] text-[10px]">ارسال با پیک یا پست پیشتاز</span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[var(--text-muted)] bg-[var(--bg-main)]/70">شرایط تست و تعویض</td>
                  {compareList.map(p => (
                    <td key={p.id} className="p-3 text-[var(--text-muted)] text-[11px] align-top">
                      <span className="text-[var(--text-main)] font-medium block">
                        {p.testExchangeBox?.testWindow || p.warranty || 'در صفحه‌ی محصول نوشته شده'}
                      </span>
                      {p.testExchangeBox?.covered && (
                        <span className="text-[10px] text-[var(--text-muted)]">{p.testExchangeBox.covered}</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end items-center pt-2 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-xs font-bold text-[#F7F3EA] transition-colors"
          >
            بستن مقایسه
          </button>
        </div>
      </div>
    </div>
  );
};
