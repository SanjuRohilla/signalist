

'use client';

import { useForm, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {
    INVESTMENT_GOALS,
    PREFERRED_INDUSTRIES,
    RISK_TOLERANCE_OPTIONS,
} from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import { signUpWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";

const SignUp = () => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            country: "US",
            investmentGoals: "Growth",
            riskTolerance: "Medium",
            preferredIndustry: "Technology",
        },
        mode: "onBlur",
    });

    // Bridge between the form's specific type and the reusable
    // select components' current Control<Record<string, string>> prop.
    const selectControl = control as unknown as Control<
        Record<string, string>
    >;

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);

            if (result.success) {
                toast.success("Account created successfully!");
                window.location.assign("/");
            } else {
                toast.error(result.error || "Sign up failed");
            }
        } catch (error) {
            console.error("Sign up failed:", error);

            toast.error("Sign up failed", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to create an account.",
            });
        }
    };

    return (
        <>
            <h1 className="form-title">Sign Up & Personalize</h1>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
            >
                <InputField
                    name="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    register={register}
                    error={errors.fullName}
                    validation={{
                        required: "Full name is required",
                        minLength: 2,
                    }}
                />

                <InputField
                    name="email"
                    label="Email"
                    placeholder="contact@jsmastery.com"
                    register={register}
                    error={errors.email}
                    validation={{
                        required: "Email is required",
                        pattern: /^\w+@\w+\.\w+$/,
                    }}
                />

                <InputField
                    name="password"
                    label="Password"
                    placeholder="Enter a strong password"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{
                        required: "Password is required",
                        minLength: 8,
                    }}
                />

                <CountrySelectField
                    name="country"
                    label="Country"
                    control={selectControl}
                    error={errors.country}
                    required
                />

                <SelectField
                    name="investmentGoals"
                    label="Investment Goals"
                    placeholder="Select your investment goal"
                    options={INVESTMENT_GOALS}
                    control={selectControl}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label="Risk Tolerance"
                    placeholder="Select your risk level"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={selectControl}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label="Preferred Industry"
                    placeholder="Select your preferred industry"
                    options={PREFERRED_INDUSTRIES}
                    control={selectControl}
                    error={errors.preferredIndustry}
                    required
                />

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="yellow-btn w-full mt-5"
                >
                    {isSubmitting
                        ? "Creating Account"
                        : "Start Your Investing Journey"}
                </Button>

                <FooterLink
                    text="Already have an account?"
                    linkText="Sign in"
                    href="/sign-in"
                />
            </form>
        </>
    );
};

export default SignUp;
