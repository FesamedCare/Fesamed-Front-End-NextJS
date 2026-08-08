'use client';

import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import Link from 'next/link';
import { CircleLoader } from 'react-spinners';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/bootstrap.css';
import '../../globals.css';
import { useState } from 'react';
import { useTranslation } from "@/i18n/LocaleProvider";

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  budget: string;
}

export default function Form() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    budget: '',
  });

  const { name, email, phone, subject, message, budget } = formData;

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | string
  ) => {
    if (typeof e === 'string') {
      setFormData({ ...formData, phone: e });
    } else {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!enabled) {
      alert(t("misc.acceptTermsAlert"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message, budget }),
      });

      if (res.ok) {
        setLoading(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
          budget: '',
        });
        alert(t("misc.messageSent"));
      } else {
        throw new Error('Error al enviar el mensaje.');
      }
    } catch (error) {
      setLoading(false);
      alert(t("misc.messageError"));
    }
  };

  return (
    <div className="relative bg-white">
      <div className="absolute inset-0">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-50" />
      </div>
      <div className="relative mx-auto max-w-7xl lg:grid lg:grid-cols-5">
        <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:col-span-2 lg:px-8 lg:py-14 xl:pr-12">
          <div className="mx-auto max-w-lg">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {t("contact.title")}
            </h2>
            <p className="mt-3 text-lg leading-6 text-gray-500">
              {t("contact.subtitle")}
            </p>
            <dl className="mt-8 text-base text-gray-500">
              <div>
                <dt className="sr-only">FesamedCare</dt>
                <dd>
                  <p>{t("contact.company")}</p>
                  <p>@FesamedCare</p>
                </dd>
              </div>
              <div className="mt-6">
                <dt className="sr-only">{t("ui.srPhone")}</dt>
                <dd className="flex">
                  <PhoneIcon className="h-6 w-6 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="ml-3">+57 3207263798</span>
                </dd>
              </div>
              <div className="mt-3">
                <dt className="sr-only">{t("ui.srEmail")}</dt>
                <dd className="flex">
                  <EnvelopeIcon className="h-6 w-6 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="ml-3">admin@fesamedcare.com</span>
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-base text-gray-500">
              {t("misc.needSpecialist")}{' '}
              <Link href="/buscar-doctor" className="font-medium text-gray-700 underline">
                {t("contact.seeSpecialists")}
              </Link>
              .
            </p>
          </div>
        </div>


        <div className="bg-white py-16 px-4 sm:px-6 lg:col-span-3 lg:py-14 lg:px-8 xl:pl-12">
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-y-6">
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              required
              placeholder={t("contact.fullName")}
              className="block w-full rounded-md border-gray-300 border py-3 px-4 shadow-sm focus:ring-indigo-500"
            />
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
              placeholder={t("contact.email")}
              className="block w-full rounded-md border-gray-300 border py-3 px-4 shadow-sm focus:ring-indigo-500"
            />
            <PhoneInput
              value={phone}
              onChange={(value) => onChange(value)}
              country="co"
              containerClass="custom-phone-input"
            />
            <input
              type="text"
              name="subject"
              value={subject}
              onChange={onChange}
              required
              placeholder={t("contact.subject")}
              className="block w-full rounded-md border-gray-300 border py-3 px-4 shadow-sm focus:ring-indigo-500"
            />
            <textarea
              name="message"
              value={message}
              onChange={onChange}
              rows={4}
              required
              placeholder={t("contact.description")}
              className="block w-full rounded-md border-gray-300 border py-3 px-4 shadow-sm focus:ring-indigo-500"
            />
            <select
              name="budget"
              value={budget}
              onChange={onChange}
              className="block w-full rounded-md border-gray-300 border py-2 pl-3 pr-10"
            >
              <option value="">{t("contact.budgetPlaceholder")}</option>
              <option value="0-5k">$0 - 5000</option>
              <option value="5-10k">$5,000 - 10,000</option>
              <option value="10-25k">$10,000 - 25,000</option>
            </select>
            <div className="flex items-center">
              <Switch
                checked={enabled}
                onChange={setEnabled}
                className={`${
                  enabled ? 'bg-blue-500' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full transition`}
              >
                <span
                  className={`${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </Switch>
              <span className="ml-4 text-gray-500">
                Acepto los{' '}
                <Link href="/terms" className="font-medium text-blue-600">
                  {t("misc.termsAndConditions")}
                </Link>{' '}
                y{' '}
                <Link href="/privacy" className="font-medium text-blue-600">
                  {t("misc.privacyPolicy")}
                </Link>
                .
              </span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`relative items-center rounded-md bg-blue-500 px-4 py-2 text-white shadow-sm focus:ring-2 focus:ring-indigo-500 ${
                loading ? 'opacity-50' : 'hover:bg-blue-600'
              }`}
            >
              {loading ? <CircleLoader loading={loading} size={15} color="#ffffff" /> : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
