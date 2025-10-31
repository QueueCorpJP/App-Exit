'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function BoardCreatePage() {
  const [userType, setUserType] = useState<'buyer' | 'seller' | null>(null)
  const [content, setContent] = useState('')
  const [budget, setBudget] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // LocalStorageからユーザータイプを取得
    const storedUserType = localStorage.getItem('userType') as 'buyer' | 'seller'
    setUserType(storedUserType)
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: APIに投稿を送信
      // const formData = new FormData()
      // formData.append('content', content)
      // if (budget) formData.append('budget', budget)
      // if (image) formData.append('image', image)

      console.log('投稿データ:', {
        content,
        budget: budget ? parseInt(budget) : null,
        image,
      })

      // 投稿成功後、掲示板一覧へ遷移
      router.push('/boards')
    } catch (error) {
      console.error('投稿エラー:', error)
      alert('投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F8F7' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          掲示板に投稿
        </h1>
        <p className="text-gray-600 mb-8">
          {userType === 'seller'
            ? 'あなたのアプリについて簡単に紹介してください'
            : 'どんなアプリをお探しですか?'}
        </p>

        <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-900 p-8">
          {/* 投稿内容 */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              投稿内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                userType === 'seller'
                  ? '例: ECサイトを売ります。月間売上100万円。興味のある方はDMください。'
                  : '例: 予算300万円で予約管理システムを探しています。'
              }
              rows={6}
              required
              className="w-full px-4 py-3 border border-gray-300 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length} / 1000文字
            </p>
          </div>

          {/* 予算（買い手の場合のみ） */}
          {userType === 'buyer' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                予算（円）
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="3000000"
                min="0"
                step="10000"
                className="w-full px-4 py-3 border border-gray-300 border-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                予算を提示すると、売り手からの反応が得やすくなります
              </p>
            </div>
          )}

          {/* 画像アップロード */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              画像（任意）
            </label>
            <div className="border-2 border-dashed border-gray-300 border-2 p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="プレビュー"
                    className="max-h-64 mx-auto border-2"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setImagePreview('')
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-gray-600 mb-2">
                    クリックして画像をアップロード
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block bg-gray-100 text-gray-700 px-4 py-2 border-2 cursor-pointer hover:bg-gray-200"
                  >
                    ファイルを選択
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mb-6 bg-blue-50 border border-blue-200 border-2 p-4">
            <div className="flex items-start space-x-2">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">投稿のガイドライン</p>
                <ul className="space-y-1">
                  <li>• 具体的な情報を記載すると反応が得やすくなります</li>
                  <li>• 直接の連絡先交換は禁止されています</li>
                  <li>• 詳細はDMでやり取りしてください</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 送信ボタン */}
          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={!content}
              isLoading={isSubmitting}
              loadingText="投稿中..."
            >
              投稿する
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
